import { Router } from 'express';
import { Article, Project, Service, TeamMember, Testimonial, getSettings } from '../models';
import { BUDGET_RANGES, PROJECT_TYPES, TIMELINES } from '../schemas';
import { ah, notFound } from '../utils/errors';
import { escapeRegex } from '../utils/text';
import { meta, paging, publicCache, publishedFilter, str } from '../utils/helpers';

const r = Router();
r.use(publicCache(60));

const PROJECT_SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { year: -1, publishedAt: -1 },
  oldest: { year: 1, publishedAt: 1 },
  largest: { areaSqFt: -1 },
  smallest: { areaSqFt: 1 },
  title: { title: 1 },
};

r.get('/meta/enquiry-options', (_req, res) => {
  res.json({ data: { projectTypes: PROJECT_TYPES, budgetRanges: BUDGET_RANGES, timelines: TIMELINES } });
});

r.get(
  '/settings',
  ah(async (_req, res) => {
    const s = (await getSettings()).toJSON() as any;
    delete s.notificationEmail;
    res.json({ data: s });
  }),
);

/* ---------- projects ---------- */
r.get(
  '/projects/filters',
  ah(async (_req, res) => {
    const [categories, locations] = await Promise.all([
      Project.distinct('category', publishedFilter()),
      Project.distinct('location', publishedFilter()),
    ]);
    res.json({ data: { categories: categories.sort(), locations: locations.sort() } });
  }),
);

r.get(
  '/projects',
  ah(async (req, res) => {
    const { page, limit, skip } = paging(req.query, 9, 48);
    const filter: Record<string, any> = { ...publishedFilter() };
    const category = str(req.query.category);
    const location = str(req.query.location);
    const q = str(req.query.q);
    if (category) filter.category = category;
    if (location) filter.location = location;
    if (req.query.featured === 'true') filter.featured = true;
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: 'i' };
      filter.$or = [{ title: rx }, { summary: rx }, { location: rx }, { category: rx }, { tags: rx }];
    }
    const sort = req.query.featured === 'true' ? { featuredOrder: 1 as const } : PROJECT_SORTS[str(req.query.sort)] || PROJECT_SORTS.newest;
    const [data, total] = await Promise.all([Project.find(filter).sort(sort).skip(skip).limit(limit), Project.countDocuments(filter)]);
    res.json({ data, meta: meta(page, limit, total) });
  }),
);

r.get(
  '/projects/:slug',
  ah(async (req, res) => {
    const project = await Project.findOne({ slug: req.params.slug, ...publishedFilter() });
    if (!project) throw notFound('That project could not be found.');
    const base = { ...publishedFilter(), _id: { $ne: project._id } };
    let related = await Project.find({ ...base, $or: [{ category: project.category }, { location: project.location }] }).sort({ year: -1 }).limit(3);
    if (related.length < 3) {
      const more = await Project.find({ ...base, _id: { $nin: [project._id, ...related.map((p) => p._id)] } }).sort({ featuredOrder: 1 }).limit(3 - related.length);
      related = related.concat(more);
    }
    res.json({ data: project, related });
  }),
);

/* ---------- services ---------- */
r.get(
  '/services',
  ah(async (_req, res) => {
    res.json({ data: await Service.find({ published: true }).sort({ order: 1 }) });
  }),
);
r.get(
  '/services/:slug',
  ah(async (req, res) => {
    const s = await Service.findOne({ slug: req.params.slug, published: true });
    if (!s) throw notFound('That service could not be found.');
    res.json({ data: s });
  }),
);

/* ---------- articles ---------- */
r.get(
  '/articles/categories',
  ah(async (_req, res) => {
    res.json({ data: (await Article.distinct('category', publishedFilter())).sort() });
  }),
);
r.get(
  '/articles',
  ah(async (req, res) => {
    const { page, limit, skip } = paging(req.query, 9, 48);
    const filter: Record<string, any> = { ...publishedFilter() };
    if (str(req.query.category)) filter.category = str(req.query.category);
    const q = str(req.query.q);
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: 'i' };
      filter.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }];
    }
    const [data, total] = await Promise.all([
      Article.find(filter).select('-body').sort({ publishedAt: -1 }).skip(skip).limit(limit),
      Article.countDocuments(filter),
    ]);
    res.json({ data, meta: meta(page, limit, total) });
  }),
);
r.get(
  '/articles/:slug',
  ah(async (req, res) => {
    const a = await Article.findOne({ slug: req.params.slug, ...publishedFilter() });
    if (!a) throw notFound('That article could not be found.');
    const related = await Article.find({ ...publishedFilter(), _id: { $ne: a._id }, $or: [{ category: a.category }, { tags: { $in: a.tags } }] })
      .select('-body')
      .sort({ publishedAt: -1 })
      .limit(3);
    res.json({ data: a, related });
  }),
);

/* ---------- testimonials + team ---------- */
r.get(
  '/testimonials',
  ah(async (_req, res) => {
    res.json({ data: await Testimonial.find({ approved: true }).sort({ order: 1 }).populate('projectId', 'slug title') });
  }),
);
r.get(
  '/team',
  ah(async (_req, res) => {
    res.json({ data: await TeamMember.find({ published: true }).sort({ order: 1 }) });
  }),
);

export default r;
