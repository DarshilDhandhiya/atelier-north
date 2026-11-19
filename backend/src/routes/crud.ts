import { Router } from 'express';
import type { Model } from 'mongoose';
import { ah, badRequest, notFound, parse } from '../utils/errors';
import { escapeRegex } from '../utils/text';
import { meta, paging, str, uniqueSlug } from '../utils/helpers';
import { z } from 'zod';

interface CrudOptions {
  model: Model<any>;
  schema: z.ZodObject<any>;
  searchFields: string[];
  sort: Record<string, 1 | -1>;
  /** Auto-generate a slug from this field */
  slugFrom?: string;
  /** 'date' = publishedAt (null = draft); 'flag' = boolean `published` */
  publish?: 'date' | 'flag';
  /** Field that stores manual ordering (enables PUT /order) */
  orderField?: string;
  populate?: string;
  /** Extra clean-up after a delete */
  afterDelete?: (doc: any) => Promise<void>;
}

/** Generic admin CRUD router: list/search/paginate, create, update, delete, publish/unpublish, reorder. */
export function crudRouter(o: CrudOptions) {
  const r = Router();
  const createSchema = o.schema;
  const updateSchema = o.schema.partial();

  r.get(
    '/',
    ah(async (req, res) => {
      const { page, limit, skip } = paging(req.query, 20);
      const filter: Record<string, any> = {};
      const q = str(req.query.q);
      if (q) filter.$or = o.searchFields.map((f) => ({ [f]: { $regex: escapeRegex(q), $options: 'i' } }));
      const status = str(req.query.status);
      if (o.publish === 'date' && status === 'published') filter.publishedAt = { $ne: null, $lte: new Date() };
      if (o.publish === 'date' && status === 'draft') filter.publishedAt = null;
      if (o.publish === 'flag' && (status === 'published' || status === 'draft')) filter.published = status === 'published';
      const query = o.model.find(filter).sort(o.sort).skip(skip).limit(limit);
      if (o.populate) query.populate(o.populate);
      const [data, total] = await Promise.all([query, o.model.countDocuments(filter)]);
      res.json({ data, meta: meta(page, limit, total) });
    }),
  );

  if (o.orderField) {
    r.put(
      '/order',
      ah(async (req, res) => {
        const { ids } = parse<{ ids: string[] }>(z.object({ ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(200) }), req.body);
        await Promise.all(ids.map((id, i) => o.model.updateOne({ _id: id }, { $set: { [o.orderField!]: i } })));
        res.json({ data: { ok: true } });
      }),
    );
  }

  r.get(
    '/:id',
    ah(async (req, res) => {
      const query = o.model.findById(req.params.id);
      if (o.populate) query.populate(o.populate);
      const doc = await query;
      if (!doc) throw notFound();
      res.json({ data: doc });
    }),
  );

  r.post(
    '/',
    ah(async (req, res) => {
      const data: any = parse(createSchema, req.body);
      if (o.slugFrom) data.slug = await uniqueSlug(o.model, data.slug || data[o.slugFrom]);
      const doc = await o.model.create(data);
      res.status(201).json({ data: doc });
    }),
  );

  const update = ah(async (req, res) => {
    const doc = await o.model.findById(req.params.id);
    if (!doc) throw notFound();
    const data: any = parse(updateSchema, req.body);
    if (Object.keys(data).length === 0) throw badRequest('Send at least one field to update.');
    if (o.slugFrom && data.slug && data.slug !== doc.get('slug')) data.slug = await uniqueSlug(o.model, data.slug, doc.id);
    doc.set(data);
    await doc.save();
    res.json({ data: doc });
  });
  r.put('/:id', update);
  r.patch('/:id', update);

  if (o.publish) {
    const setPublished = (on: boolean) =>
      ah(async (req, res) => {
        const doc = await o.model.findById(req.params.id);
        if (!doc) throw notFound();
        if (o.publish === 'date') doc.set('publishedAt', on ? (doc.get('publishedAt') && doc.get('publishedAt') <= new Date() ? doc.get('publishedAt') : new Date()) : null);
        else doc.set('published', on);
        await doc.save();
        res.json({ data: doc });
      });
    r.post('/:id/publish', setPublished(true));
    r.post('/:id/unpublish', setPublished(false));
  }

  r.delete(
    '/:id',
    ah(async (req, res) => {
      const doc = await o.model.findByIdAndDelete(req.params.id);
      if (!doc) throw notFound();
      if (o.afterDelete) await o.afterDelete(doc);
      res.json({ data: { ok: true } });
    }),
  );

  return r;
}
