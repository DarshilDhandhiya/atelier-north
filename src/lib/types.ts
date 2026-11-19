export interface Attribution {
  creator?: string;
  source?: string;
  sourceUrl?: string;
  license?: string;
}
export interface ImageRef {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  attribution?: Attribution;
}
export interface Seo {
  title?: string;
  description?: string;
  ogImage?: string;
}
export interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
  location: string;
  year: number;
  areaSqFt: number;
  summary: string;
  brief: string;
  approach: string;
  scope: string[];
  coverImage: ImageRef;
  gallery: ImageRef[];
  tags: string[];
  featured: boolean;
  featuredOrder: number;
  publishedAt: string | null;
  demo: boolean;
  seo?: Seo;
}
export interface Service {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  deliverables: string[];
  steps: { title: string; description: string }[];
  faq: { question: string; answer: string }[];
  heroImage?: ImageRef | null;
  order: number;
  published: boolean;
}
export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body?: string;
  coverImage: ImageRef;
  category: string;
  author: string;
  tags: string[];
  readingTime: number;
  publishedAt: string | null;
  seo?: Seo;
}
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  projectId: { id: string; slug: string; title: string } | string | null;
  approved: boolean;
  order: number;
}
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo?: ImageRef | null;
  credentials: string[];
  order: number;
  published: boolean;
}
export interface SiteSettings {
  brand: { name: string; tagline?: string; description?: string };
  contact: { email?: string; phone?: string; address?: string; city?: string; mapUrl?: string; hours?: string };
  social: { instagram?: string; linkedin?: string; pinterest?: string };
  seoDefaults: { title?: string; description?: string; ogImage?: string };
  notificationEmail?: string;
  home: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroImage?: ImageRef | null;
    positioning?: string;
    stats?: { value: string; label: string }[];
    processTitle?: string;
    processSteps?: { title: string; description: string }[];
    ctaTitle?: string;
    ctaText?: string;
  };
  about: {
    title?: string;
    story?: string;
    values?: { title: string; description: string }[];
    credentials?: string[];
    image?: ImageRef | null;
    gallery?: ImageRef[];
  };
}
export interface Paged<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
export interface EnquiryOptions {
  projectTypes: string[];
  budgetRanges: string[];
  timelines: string[];
}
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor';
  status: 'active' | 'disabled';
  lastLoginAt?: string;
}
export interface Enquiry {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  location: string;
  budgetRange: string;
  timeline: string;
  message: string;
  attachmentUrl?: string;
  attachment?: { originalName: string; mimeType: string; size: number };
  consent: boolean;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  assignee?: { id: string; name: string; email: string } | null;
  notes: { _id?: string; authorName: string; body: string; createdAt: string }[];
  sourceProject?: string;
  sourceService?: string;
  emailStatus: 'pending' | 'sent' | 'failed' | 'skipped';
  emailAttempts: number;
  emailError?: string;
  emailLastAttemptAt?: string;
  createdAt: string;
}
export interface MediaItem {
  id: string;
  url: string;
  alt: string;
  width?: number;
  height?: number;
  mimeType?: string;
  size?: number;
  createdAt: string;
}
