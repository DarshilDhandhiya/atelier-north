import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { imageSize } from 'image-size';
import { z } from 'zod';
import { config } from '../config';
import { csrfGuard, requireAuth, requireRole } from '../middleware/auth';
import { Article, Attachment, Enquiry, Media, Project, Service, SiteSettings, TeamMember, Testimonial, User, getSettings } from '../models';
import {
  articleSchema,
  enquiryUpdateSchema,
  noteSchema,
  projectSchema,
  serviceSchema,
  settingsSchema,
  teamSchema,
  testimonialSchema,
  userCreateSchema,
  userUpdateSchema,
  imageRef,
} from '../schemas';
import { deleteImage, saveImage } from '../services/storage';
import { notifyStaff } from '../services/mailer';
import { ah, badRequest, conflict, forbidden, notFound, parse } from '../utils/errors';
import { IMAGE_MIMES, detectFileType } from '../utils/fileType';
import { meta, noStore, paging, str } from '../utils/helpers';
import { escapeRegex, plain } from '../utils/text';
import { crudRouter } from './crud';

const admin = Router();
admin.use(noStore, csrfGuard, requireAuth);

const content = requireRole('admin', 'editor');
const adminOnly = requireRole('admin');

/* ---------- content (editors + admins) ---------- */
const projects = Router();
projects.put(
  '/featured-order',
  ah(async (req, res) => {
    const { ids } = parse<{ ids: string[] }>(z.object({ ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(50) }), req.body);
    await Project.updateMany({ _id: { $nin: ids } }, { $set: { featured: false } });
    await Promise.all(ids.map((id, i) => Project.updateOne({ _id: id }, { $set: { featured: true, featuredOrder: i } })));
    res.json({ data: { ok: true } });
  }),
);
projects.use(
  crudRouter({
    model: Project,
    schema: projectSchema,
    searchFields: ['title', 'location', 'category', 'slug'],
    sort: { updatedAt: -1 },
    slugFrom: 'title',
    publish: 'date',
    afterDelete: async (doc) => {
      await Testimonial.updateMany({ projectId: doc._id }, { $set: { projectId: null } });
    },
  }),
);
admin.use('/projects', content, projects);
admin.use('/services', content, crudRouter({ model: Service, schema: serviceSchema, searchFields: ['title', 'summary'], sort: { order: 1 }, slugFrom: 'title', publish: 'flag', orderField: 'order' }));
admin.use('/articles', content, crudRouter({ model: Article, schema: articleSchema, searchFields: ['title', 'category', 'author'], sort: { updatedAt: -1 }, slugFrom: 'title', publish: 'date' }));
admin.use('/testimonials', content, crudRouter({ model: Testimonial, schema: testimonialSchema, searchFields: ['name', 'quote'], sort: { order: 1 }, orderField: 'order', populate: 'projectId' }));
admin.use('/team', content, crudRouter({ model: TeamMember, schema: teamSchema, searchFields: ['name', 'role'], sort: { order: 1 }, orderField: 'order', publish: 'flag' }));

/* ---------- media library ---------- */
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.MAX_IMAGE_MB * 1024 * 1024, files: 1 } });
const media = Router();
media.get(
  '/',
  ah(async (req, res) => {
    const { page, limit, skip } = paging(req.query, 24);
    const [data, total] = await Promise.all([Media.find().sort({ createdAt: -1 }).skip(skip).limit(limit), Media.countDocuments()]);
    res.json({ data, meta: meta(page, limit, total) });
  }),
);
media.post(
  '/',
  imageUpload.single('file'),
  ah(async (req, res) => {
    if (!req.file) throw badRequest('Choose an image to upload.', [{ path: 'file', message: 'Choose an image to upload.' }]);
    const type = detectFileType(req.file.buffer);
    if (!type || !IMAGE_MIMES.includes(type.mime)) throw badRequest('Upload a JPG, PNG or WebP image.', [{ path: 'file', message: 'Upload a JPG, PNG or WebP image.' }]);
    let width: number | undefined;
    let height: number | undefined;
    try {
      const dim = imageSize(req.file.buffer);
      width = dim.width;
      height = dim.height;
    } catch {
      throw badRequest('That image could not be read. Try exporting it again.');
    }
    const alt = plain(String(req.body.alt || ''));
    const stored = await saveImage(req.file.buffer, type.ext, type.mime);
    const doc = await Media.create({
      url: stored.url,
      storageKey: stored.key,
      driver: stored.driver,
      alt,
      width,
      height,
      mimeType: type.mime,
      size: req.file.size,
      attribution: req.body.creator ? { creator: plain(String(req.body.creator)), source: 'Uploaded by studio', license: 'Owned by studio' } : { source: 'Uploaded by studio', license: 'Owned by studio' },
      uploadedBy: req.user!.id,
    });
    res.status(201).json({ data: doc });
  }),
);
media.put(
  '/:id',
  ah(async (req, res) => {
    const { alt } = parse<{ alt: string }>(z.object({ alt: imageRef.shape.alt }), req.body);
    const doc = await Media.findByIdAndUpdate(req.params.id, { alt }, { new: true });
    if (!doc) throw notFound();
    res.json({ data: doc });
  }),
);
media.delete(
  '/:id',
  ah(async (req, res) => {
    const doc = await Media.findByIdAndDelete(req.params.id);
    if (!doc) throw notFound();
    await deleteImage(doc.storageKey ?? undefined, doc.driver ?? undefined);
    res.json({ data: { ok: true } });
  }),
);
admin.use('/media', content, media);

/* ---------- enquiries (admin only) ---------- */
const enquiries = Router();
enquiries.use(adminOnly);

function enquiryFilter(query: Record<string, unknown>) {
  const filter: Record<string, any> = {};
  const status = str(query.status);
  if (['new', 'contacted', 'qualified', 'closed'].includes(status)) filter.status = status;
  const email = str(query.emailStatus);
  if (['pending', 'sent', 'failed', 'skipped'].includes(email)) filter.emailStatus = email;
  const q = str(query.q);
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }, { reference: rx }, { location: rx }, { message: rx }];
  }
  return filter;
}

enquiries.get(
  '/',
  ah(async (req, res) => {
    const { page, limit, skip } = paging(req.query, 20);
    const filter = enquiryFilter(req.query);
    const [data, total, counts] = await Promise.all([
      Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('assignee', 'name email'),
      Enquiry.countDocuments(filter),
      Promise.all(['new', 'contacted', 'qualified', 'closed'].map(async (s) => [s, await Enquiry.countDocuments({ status: s })] as const)),
    ]);
    res.json({ data, meta: meta(page, limit, total), counts: Object.fromEntries(counts) });
  }),
);

const csvCell = (v: unknown) => {
  let s = v === undefined || v === null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};
enquiries.get(
  '/export.csv',
  ah(async (req, res) => {
    const rows = await Enquiry.find(enquiryFilter(req.query)).sort({ createdAt: -1 }).limit(5000).populate('assignee', 'name');
    const head = ['reference', 'createdAt', 'status', 'name', 'email', 'phone', 'projectType', 'location', 'budgetRange', 'timeline', 'assignee', 'message'];
    const lines = [head.join(',')].concat(
      rows.map((e: any) => [e.reference, e.createdAt?.toISOString(), e.status, e.name, e.email, e.phone, e.projectType, e.location, e.budgetRange, e.timeline, e.assignee?.name, e.message].map(csvCell).join(',')),
    );
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="enquiries.csv"' });
    res.send('﻿' + lines.join('\r\n'));
  }),
);

enquiries.get(
  '/:id',
  ah(async (req, res) => {
    const e = await Enquiry.findById(req.params.id).populate('assignee', 'name email');
    if (!e) throw notFound();
    res.json({ data: e });
  }),
);
enquiries.patch(
  '/:id',
  ah(async (req, res) => {
    const data = parse<{ status?: string; assignee?: string | null }>(enquiryUpdateSchema, req.body);
    if (data.assignee) {
      const u = await User.findOne({ _id: data.assignee, status: 'active' });
      if (!u) throw badRequest('That team member could not be found.', [{ path: 'assignee', message: 'Choose an active user.' }]);
    }
    const e = await Enquiry.findById(req.params.id);
    if (!e) throw notFound();
    if (data.status) e.status = data.status as any;
    if (data.assignee !== undefined) e.assignee = data.assignee as any;
    await e.save();
    await e.populate('assignee', 'name email');
    res.json({ data: e });
  }),
);
enquiries.post(
  '/:id/notes',
  ah(async (req, res) => {
    const { body } = parse<{ body: string }>(noteSchema, req.body);
    const e = await Enquiry.findById(req.params.id);
    if (!e) throw notFound();
    e.notes.push({ author: req.user!.id as any, authorName: req.user!.name, body } as any);
    await e.save();
    await e.populate('assignee', 'name email');
    res.status(201).json({ data: e });
  }),
);
enquiries.post(
  '/:id/retry-email',
  ah(async (req, res) => {
    const e = await Enquiry.findById(req.params.id);
    if (!e) throw notFound();
    if (e.emailStatus === 'sent') throw conflict('The notification was already sent.');
    await notifyStaff(e.id);
    const fresh = await Enquiry.findById(e.id).populate('assignee', 'name email');
    res.json({ data: fresh });
  }),
);
enquiries.get(
  '/:id/attachment',
  ah(async (req, res) => {
    const e = await Enquiry.findById(req.params.id);
    const attId = e?.attachment?.attachmentId;
    if (!e || !attId) throw notFound('This enquiry has no attachment.');
    const att = await Attachment.findById(attId);
    if (!att) throw notFound('The attachment is no longer available.');
    res.set({
      'Content-Type': att.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${att.filename}"`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    });
    res.send(att.data);
  }),
);
enquiries.delete(
  '/:id',
  ah(async (req, res) => {
    const e = await Enquiry.findByIdAndDelete(req.params.id);
    if (!e) throw notFound();
    await Attachment.deleteMany({ enquiryId: e._id });
    res.json({ data: { ok: true } });
  }),
);
admin.use('/enquiries', enquiries);

/* ---------- users (admin only) ---------- */
const users = Router();
users.use(adminOnly);
users.get(
  '/',
  ah(async (_req, res) => {
    res.json({ data: await User.find().sort({ createdAt: 1 }) });
  }),
);
users.post(
  '/',
  ah(async (req, res) => {
    const { password, ...data } = parse<any>(userCreateSchema, req.body);
    const user = await User.create({ ...data, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ data: user });
  }),
);
users.patch(
  '/:id',
  ah(async (req, res) => {
    const { password, ...data } = parse<any>(userUpdateSchema, req.body);
    const user = await User.findById(req.params.id);
    if (!user) throw notFound();
    const demotesSelf = user.id === req.user!.id && ((data.role && data.role !== 'admin') || data.status === 'disabled');
    if (demotesSelf) throw forbidden('You cannot disable or demote your own account.');
    if (user.role === 'admin' && ((data.role && data.role !== 'admin') || data.status === 'disabled')) {
      const admins = await User.countDocuments({ role: 'admin', status: 'active' });
      if (admins <= 1) throw conflict('Keep at least one active admin.');
    }
    user.set(data);
    if (password) user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();
    res.json({ data: user });
  }),
);
users.delete(
  '/:id',
  ah(async (req, res) => {
    if (req.params.id === req.user!.id) throw forbidden('You cannot delete your own account.');
    const user = await User.findById(req.params.id);
    if (!user) throw notFound();
    if (user.role === 'admin' && (await User.countDocuments({ role: 'admin', status: 'active' })) <= 1) throw conflict('Keep at least one active admin.');
    await user.deleteOne();
    res.json({ data: { ok: true } });
  }),
);
admin.use('/users', users);

/* ---------- settings (admin only) ---------- */
admin.get(
  '/settings',
  adminOnly,
  ah(async (_req, res) => {
    res.json({ data: await getSettings() });
  }),
);
admin.put(
  '/settings',
  adminOnly,
  ah(async (req, res) => {
    const data = parse<any>(settingsSchema.partial(), req.body);
    const s = await getSettings();
    for (const [k, v] of Object.entries(data)) s.set(k, v);
    await s.save();
    res.json({ data: s });
  }),
);

/* ---------- dashboard ---------- */
admin.get(
  '/stats',
  ah(async (req, res) => {
    const now = new Date();
    const isAdmin = req.user!.role === 'admin';
    const [projectsPublished, projectsDraft, articlesPublished, articlesDraft, services, testimonials] = await Promise.all([
      Project.countDocuments({ publishedAt: { $ne: null, $lte: now } }),
      Project.countDocuments({ publishedAt: null }),
      Article.countDocuments({ publishedAt: { $ne: null, $lte: now } }),
      Article.countDocuments({ publishedAt: null }),
      Service.countDocuments({ published: true }),
      Testimonial.countDocuments({ approved: true }),
    ]);
    const base = { projects: { published: projectsPublished, draft: projectsDraft }, articles: { published: articlesPublished, draft: articlesDraft }, services, testimonials };
    if (!isAdmin) return res.json({ data: base });
    const [newEnquiries, failedEmails, total, recent] = await Promise.all([
      Enquiry.countDocuments({ status: 'new' }),
      Enquiry.countDocuments({ emailStatus: 'failed' }),
      Enquiry.countDocuments(),
      Enquiry.find().sort({ createdAt: -1 }).limit(5),
    ]);
    res.json({ data: { ...base, enquiries: { new: newEnquiries, failedEmails, total, recent } } });
  }),
);

export default admin;
// SiteSettings is imported for side-effects (model registration) when the router loads.
void SiteSettings;
