import { describe, expect, it } from 'vitest';
import { validateEnquiry, type EnquiryValues } from '../lib/enquiryForm';

const ok: EnquiryValues = {
  name: 'Ada Lovelace', email: 'ada@example.com', phone: '', projectType: 'Renovation', location: 'Oslo, Norway',
  budgetRange: '$50k – $150k', timeline: 'Just exploring', message: 'We want to renovate a small house and keep its character.', consent: true,
};
const file = (name: string, type: string, size = 1000) => new File([new Uint8Array(size)], name, { type });

describe('enquiry form validation', () => {
  it('accepts a complete valid enquiry', () => expect(validateEnquiry(ok, null)).toEqual({}));
  it('requires every mandatory field', () => {
    const e = validateEnquiry({ ...ok, name: '', email: '', projectType: '', location: '', budgetRange: '', timeline: '', message: '', consent: false }, null);
    expect(Object.keys(e).sort()).toEqual(['budgetRange', 'consent', 'email', 'location', 'message', 'name', 'projectType', 'timeline']);
  });
  it('rejects malformed email and phone', () => {
    expect(validateEnquiry({ ...ok, email: 'ada@' }, null).email).toMatch(/valid email/);
    expect(validateEnquiry({ ...ok, phone: 'abc' }, null).phone).toMatch(/valid phone/);
    expect(validateEnquiry({ ...ok, phone: '+47 22 33 44 55' }, null).phone).toBeUndefined();
  });
  it('enforces message length limits', () => {
    expect(validateEnquiry({ ...ok, message: 'too short' }, null).message).toMatch(/at least 20/);
    expect(validateEnquiry({ ...ok, message: 'x'.repeat(4001) }, null).message).toMatch(/under 4,000/);
  });
  it('validates the optional attachment type and size', () => {
    expect(validateEnquiry(ok, file('plan.pdf', 'application/pdf'))).toEqual({});
    expect(validateEnquiry(ok, file('virus.exe', 'application/x-msdownload')).attachment).toMatch(/JPG, PNG, WebP or PDF/);
    expect(validateEnquiry(ok, file('huge.pdf', 'application/pdf', 11 * 1024 * 1024)).attachment).toMatch(/larger than 10 MB/);
  });
});
