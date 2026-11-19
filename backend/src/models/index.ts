import mongoose, { Schema } from 'mongoose';
import { readingTimeMinutes } from '../utils/text';

mongoose.set('toJSON', {
  versionKey: false,
  transform: (_doc: unknown, ret: any) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
});

/* ---------- shared sub-schemas ---------- */
const attributionSchema = new Schema({ creator: String, source: String, sourceUrl: String, license: String }, { _id: false });
const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, required: true },
    width: Number,
    height: Number,
    attribution: attributionSchema,
  },
  { _id: false },
);
const seoSchema = new Schema({ title: String, description: String, ogImage: String }, { _id: false });

/* ---------- users ---------- */
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'editor'], default: 'editor' },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    lastLoginAt: Date,
  },
  { timestamps: true },
);
export const User = mongoose.model('User', userSchema);

/* ---------- media library ---------- */
const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    storageKey: String,
    driver: { type: String, enum: ['local', 'cloudinary', 'external'], default: 'local' },
    alt: { type: String, default: '' },
    width: Number,
    height: Number,
    mimeType: String,
    size: Number,
    attribution: attributionSchema,
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);
export const Media = mongoose.model('Media', mediaSchema);

/* ---------- projects ---------- */
const projectSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: { type: String, required: true, index: true },
    location: { type: String, required: true, index: true },
    year: { type: Number, required: true },
    areaSqFt: { type: Number, required: true },
    summary: { type: String, required: true },
    brief: { type: String, required: true },
    approach: { type: String, required: true },
    scope: { type: [String], default: [] },
    coverImage: { type: imageSchema, required: true },
    gallery: { type: [imageSchema], default: [] },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false, index: true },
    featuredOrder: { type: Number, default: 0 },
    publishedAt: { type: Date, default: null, index: true },
    demo: { type: Boolean, default: false },
    seo: seoSchema,
  },
  { timestamps: true },
);
projectSchema.index({ featured: 1, featuredOrder: 1 });
export const Project = mongoose.model('Project', projectSchema);

/* ---------- services ---------- */
const serviceSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    summary: { type: String, default: '' },
    description: { type: String, required: true },
    deliverables: { type: [String], default: [] },
    steps: { type: [new Schema({ title: String, description: String }, { _id: false })], default: [] },
    faq: { type: [new Schema({ question: String, answer: String }, { _id: false })], default: [] },
    heroImage: imageSchema,
    order: { type: Number, default: 0, index: true },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const Service = mongoose.model('Service', serviceSchema);

/* ---------- articles ---------- */
const articleSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    excerpt: { type: String, default: '' },
    body: { type: String, required: true },
    coverImage: { type: imageSchema, required: true },
    category: { type: String, required: true, index: true },
    author: { type: String, required: true },
    tags: { type: [String], default: [] },
    readingTime: { type: Number, default: 1 },
    publishedAt: { type: Date, default: null, index: true },
    seo: seoSchema,
  },
  { timestamps: true },
);
articleSchema.pre('validate', function (next) {
  if (this.body) this.readingTime = readingTimeMinutes(this.body);
  next();
});
export const Article = mongoose.model('Article', articleSchema);

/* ---------- testimonials ---------- */
const testimonialSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: '' },
    quote: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
    approved: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export const Testimonial = mongoose.model('Testimonial', testimonialSchema);

/* ---------- team ---------- */
const teamSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    bio: { type: String, default: '' },
    photo: imageSchema,
    credentials: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const TeamMember = mongoose.model('TeamMember', teamSchema);

/* ---------- enquiries ---------- */
export const ENQUIRY_STATUSES = ['new', 'contacted', 'qualified', 'closed'] as const;
export const EMAIL_STATUSES = ['pending', 'sent', 'failed', 'skipped'] as const;

const enquirySchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: String,
    projectType: { type: String, required: true },
    location: { type: String, required: true },
    budgetRange: { type: String, required: true },
    timeline: { type: String, required: true },
    message: { type: String, required: true },
    attachmentUrl: String,
    attachment: new Schema({ originalName: String, mimeType: String, size: Number, attachmentId: Schema.Types.ObjectId }, { _id: false }),
    consent: { type: Boolean, required: true },
    status: { type: String, enum: ENQUIRY_STATUSES, default: 'new' },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    notes: {
      type: [new Schema({ authorName: String, author: { type: Schema.Types.ObjectId, ref: 'User' }, body: String, createdAt: { type: Date, default: Date.now } })],
      default: [],
    },
    sourceProject: String,
    sourceService: String,
    emailStatus: { type: String, enum: EMAIL_STATUSES, default: 'pending' },
    emailAttempts: { type: Number, default: 0 },
    emailError: String,
    emailLastAttemptAt: Date,
    emailNextRetryAt: Date,
    ipHash: String,
    userAgent: String,
  },
  { timestamps: true },
);
enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ emailStatus: 1, emailNextRetryAt: 1 });
export const Enquiry = mongoose.model('Enquiry', enquirySchema);

const attachmentSchema = new Schema(
  {
    enquiryId: { type: Schema.Types.ObjectId, ref: 'Enquiry', index: true },
    filename: String,
    mimeType: String,
    size: Number,
    data: Buffer,
  },
  { timestamps: true },
);
export const Attachment = mongoose.model('Attachment', attachmentSchema);

/* ---------- site settings (single document) ---------- */
const labelled = new Schema({ title: String, description: String }, { _id: false });
const settingsSchema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    brand: { name: { type: String, default: 'Atelier North' }, tagline: String, description: String },
    contact: { email: String, phone: String, address: String, city: String, mapUrl: String, hours: String },
    social: { instagram: String, linkedin: String, pinterest: String },
    seoDefaults: { title: String, description: String, ogImage: String },
    notificationEmail: String,
    home: {
      heroTitle: String,
      heroSubtitle: String,
      heroImage: imageSchema,
      positioning: String,
      stats: [new Schema({ value: String, label: String }, { _id: false })],
      processTitle: String,
      processSteps: [labelled],
      ctaTitle: String,
      ctaText: String,
    },
    about: {
      title: String,
      story: String,
      values: [labelled],
      credentials: [String],
      image: imageSchema,
      gallery: [imageSchema],
    },
  },
  { timestamps: true },
);
export const SiteSettings = mongoose.model('SiteSettings', settingsSchema);

export async function getSettings() {
  let s = await SiteSettings.findOne({ key: 'main' });
  if (!s) s = await SiteSettings.create({ key: 'main' });
  return s;
}
