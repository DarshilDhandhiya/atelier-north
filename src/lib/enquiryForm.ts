import type { EnquiryOptions } from './types';

export const FALLBACK_OPTIONS: EnquiryOptions = {
  projectTypes: ['Architecture', 'Interior design', 'Renovation', 'Architecture + interiors', 'Not sure yet'],
  budgetRanges: ['Under $50k', '$50k – $150k', '$150k – $500k', '$500k+', 'Not sure yet'],
  timelines: ['As soon as possible', 'Within 3–6 months', 'Within 6–12 months', 'More than a year away', 'Just exploring'],
};

export const MAX_ATTACHMENT_MB = 10;
export const ALLOWED_ATTACHMENT = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const ALLOWED_EXT = /\.(jpe?g|png|webp|pdf)$/i;

export interface EnquiryValues {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  location: string;
  budgetRange: string;
  timeline: string;
  message: string;
  consent: boolean;
}
export type EnquiryErrors = Partial<Record<keyof EnquiryValues | 'attachment', string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+()\-\s\d.]{6,25}$/;

/** Mirrors the server-side rules so people get instant feedback; the API re-validates everything. */
export function validateEnquiry(v: EnquiryValues, file: File | null): EnquiryErrors {
  const e: EnquiryErrors = {};
  if (v.name.trim().length < 2) e.name = 'Enter your name.';
  if (!EMAIL.test(v.email.trim())) e.email = 'Enter a valid email address, like name@example.com.';
  if (v.phone.trim() && !PHONE.test(v.phone.trim())) e.phone = 'Enter a valid phone number, or leave this blank.';
  if (!v.projectType) e.projectType = 'Choose a project type.';
  if (v.location.trim().length < 2) e.location = 'Tell us where the project is.';
  if (!v.budgetRange) e.budgetRange = 'Choose a budget range.';
  if (!v.timeline) e.timeline = 'Choose a timeline.';
  const len = v.message.trim().length;
  if (len < 20) e.message = `Tell us a little more: at least 20 characters (${len} so far).`;
  else if (len > 4000) e.message = 'Please keep your message under 4,000 characters.';
  if (!v.consent) e.consent = 'Please agree to the privacy notice so we can reply.';
  if (file) {
    if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) e.attachment = `That file is larger than ${MAX_ATTACHMENT_MB} MB. Choose a smaller one.`;
    else if (!ALLOWED_ATTACHMENT.includes(file.type) && !ALLOWED_EXT.test(file.name)) e.attachment = 'Attach a JPG, PNG, WebP or PDF file.';
  }
  return e;
}
