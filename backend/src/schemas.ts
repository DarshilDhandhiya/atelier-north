import { z } from 'zod';
import { plain, rich } from './utils/text';

/* ---------- enquiry option lists: single source of truth (served at /api/meta/enquiry-options) ---------- */
export const PROJECT_TYPES = ['Architecture', 'Interior design', 'Renovation', 'Architecture + interiors', 'Not sure yet'] as const;
export const BUDGET_RANGES = ['Under $50k', '$50k – $150k', '$150k – $500k', '$500k+', 'Not sure yet'] as const;
export const TIMELINES = ['As soon as possible', 'Within 3–6 months', 'Within 6–12 months', 'More than a year away', 'Just exploring'] as const;

/* ---------- helpers ---------- */
/** Plain-text string: trimmed, length-checked, HTML stripped. */
export const text = (max = 200, min = 0) => z.string().trim().min(min, min ? `Enter at least ${min} characters.` : undefined).max(max, `Keep this under ${max} characters.`).transform(plain);
export const richText = (max = 60000, min = 1) => z.string().min(min, 'This cannot be empty.').max(max).transform(rich);

export const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only.');

/** Optional slug: an empty string from a form means "generate one from the title". */
const optionalSlug = z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), slugField.optional());

const optionalUrl = z.union([z.literal(''), z.string().trim().url().max(500)]).optional();

export const imageRef = z.object({
  url: z
    .string()
    .trim()
    .max(1000)
    .refine((u) => /^https?:\/\//i.test(u) || u.startsWith('/uploads/'), 'Use a full image URL or an uploaded file.'),
  alt: text(300, 3),
  width: z.coerce.number().int().positive().nullable().optional(),
  height: z.coerce.number().int().positive().nullable().optional(),
  attribution: z
    .object({ creator: text(120).optional(), source: text(60).optional(), sourceUrl: optionalUrl, license: text(120).optional() })
    .optional(),
});

const seo = z.object({ title: text(120).optional(), description: text(300).optional(), ogImage: optionalUrl }).optional();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id.');

/* ---------- content resources (no defaults here so .partial() never overwrites on update) ---------- */
export const projectSchema = z.object({
  slug: optionalSlug,
  title: text(140, 2),
  category: text(60, 2),
  location: text(100, 2),
  year: z.coerce.number().int().min(1900).max(2100),
  areaSqFt: z.coerce.number().int().min(0).max(10_000_000),
  summary: text(400, 10),
  brief: text(5000, 10),
  approach: text(5000, 10),
  scope: z.array(text(160, 1)).max(14),
  coverImage: imageRef,
  gallery: z.array(imageRef).max(30),
  tags: z.array(text(40, 1)).max(12),
  featured: z.boolean(),
  featuredOrder: z.coerce.number().int().min(0).max(10000),
  publishedAt: z.coerce.date().nullable(),
  demo: z.boolean(),
  seo,
});

export const serviceSchema = z.object({
  slug: optionalSlug,
  title: text(120, 2),
  summary: text(300),
  description: richText(20000),
  deliverables: z.array(text(200, 1)).max(20),
  steps: z.array(z.object({ title: text(100, 1), description: text(500, 1) })).max(10),
  faq: z.array(z.object({ question: text(200, 1), answer: text(1200, 1) })).max(15),
  heroImage: imageRef.nullable(),
  order: z.coerce.number().int().min(0).max(1000),
  published: z.boolean(),
});

export const articleSchema = z.object({
  slug: optionalSlug,
  title: text(160, 2),
  excerpt: text(400),
  body: richText(120000),
  coverImage: imageRef,
  category: text(60, 2),
  author: text(100, 2),
  tags: z.array(text(40, 1)).max(12),
  publishedAt: z.coerce.date().nullable(),
  seo,
});

export const testimonialSchema = z.object({
  name: text(100, 2),
  role: text(120),
  quote: text(1000, 10),
  projectId: objectId.nullable(),
  approved: z.boolean(),
  order: z.coerce.number().int().min(0).max(1000),
});

export const teamSchema = z.object({
  name: text(100, 2),
  role: text(120, 2),
  bio: text(1500),
  photo: imageRef.nullable(),
  credentials: z.array(text(160, 1)).max(10),
  order: z.coerce.number().int().min(0).max(1000),
  published: z.boolean(),
});

const strongPassword = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .max(128)
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), 'Include at least one letter and one number.');

export const userCreateSchema = z.object({
  name: text(100, 2),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(200),
  password: strongPassword,
  role: z.enum(['admin', 'editor']),
  status: z.enum(['active', 'disabled']),
});
export const userUpdateSchema = userCreateSchema.partial();

export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(200) });

const labelled = z.object({ title: text(120), description: text(600) });
export const settingsSchema = z.object({
  brand: z.object({ name: text(80, 1), tagline: text(200), description: text(400) }),
  contact: z.object({ email: z.string().trim().email(), phone: text(40), address: text(300), city: text(80), mapUrl: optionalUrl, hours: text(200) }),
  social: z.object({ instagram: optionalUrl, linkedin: optionalUrl, pinterest: optionalUrl }),
  seoDefaults: z.object({ title: text(120), description: text(300), ogImage: optionalUrl }),
  notificationEmail: z.union([z.literal(''), z.string().trim().email()]),
  home: z.object({
    heroTitle: text(160),
    heroSubtitle: text(400),
    heroImage: imageRef.nullable(),
    positioning: text(1200),
    stats: z.array(z.object({ value: text(20), label: text(80) })).max(6),
    processTitle: text(120),
    processSteps: z.array(labelled).max(8),
    ctaTitle: text(160),
    ctaText: text(400),
  }),
  about: z.object({
    title: text(160),
    story: text(6000),
    values: z.array(labelled).max(8),
    credentials: z.array(text(200, 1)).max(15),
    image: imageRef.nullable(),
    gallery: z.array(imageRef).max(8),
  }),
});

/* ---------- public enquiry form ---------- */
const phoneRe = /^[+()\-\s\d.]{6,25}$/;
export const enquirySchema = z.object({
  name: text(120, 2),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(200),
  phone: z.union([z.literal(''), z.string().trim().regex(phoneRe, 'Enter a valid phone number.')]).optional(),
  projectType: z.enum(PROJECT_TYPES, { message: 'Choose a project type.' }),
  location: text(120, 2),
  budgetRange: z.enum(BUDGET_RANGES, { message: 'Choose a budget range.' }),
  timeline: z.enum(TIMELINES, { message: 'Choose a timeline.' }),
  message: text(4000, 20),
  consent: z.preprocess((v) => v === true || v === 'true' || v === 'on', z.boolean()).refine((v) => v === true, 'Please agree to the privacy notice so we can reply.'),
  website: z.string().max(300).optional(), // honeypot
  formStartedAt: z.coerce.number().optional(),
  sourceProject: text(120).optional(),
  sourceService: text(120).optional(),
});

export const enquiryUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'closed']).optional(),
  assignee: objectId.nullable().optional(),
});
export const noteSchema = z.object({ body: text(2000, 1) });
