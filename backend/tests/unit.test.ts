import { describe, expect, it } from 'vitest';
import { detectFileType } from '../src/utils/fileType';
import { plain, readingTimeMinutes, rich, slugify } from '../src/utils/text';
import { enquirySchema } from '../src/schemas';
import { PNG } from './helpers';

const goodEnquiry = {
  name: 'Jo Bloggs', email: 'JO@Example.com', projectType: 'Renovation', location: 'Bergen', budgetRange: '$50k – $150k',
  timeline: 'Within 3–6 months', message: 'We would like to renovate our kitchen and study.', consent: 'true',
};

describe('text utilities', () => {
  it('slugify handles accents, ampersands and spacing', () => {
    expect(slugify('Café & Bar — Tromsø!')).toBe('cafe-and-bar-troms');
    expect(slugify('  Hello   World  ')).toBe('hello-world');
  });
  it('plain strips all HTML but keeps text and ampersands', () => {
    expect(plain('<b>Tom</b> & <script>alert(1)</script>Jerry')).toBe('Tom & Jerry');
  });
  it('rich removes scripts, event handlers and javascript: links but keeps safe formatting', () => {
    const out = rich('<p onclick="x()">Hi <strong>there</strong></p><script>alert(1)</script><a href="javascript:alert(1)">bad</a><a href="https://ok.com">ok</a>');
    expect(out).not.toMatch(/script|onclick|javascript:/i);
    expect(out).toContain('<strong>there</strong>');
    expect(out).toContain('rel="noopener noreferrer"');
  });
  it('reading time is at least one minute and scales with length', () => {
    expect(readingTimeMinutes('<p>short</p>')).toBe(1);
    expect(readingTimeMinutes(`<p>${'word '.repeat(1000)}</p>`)).toBe(5);
  });
});

describe('file type detection (magic bytes)', () => {
  it('recognises PNG regardless of name', () => expect(detectFileType(PNG)?.mime).toBe('image/png'));
  it('recognises PDF', () => expect(detectFileType(Buffer.from('%PDF-1.7 rest of file......'))?.ext).toBe('pdf'));
  it('rejects scripts and executables disguised as images', () => {
    expect(detectFileType(Buffer.from('<?php echo 1; ?> ........'))).toBeNull();
    expect(detectFileType(Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00'))).toBeNull();
  });
});

describe('enquiry validation', () => {
  it('accepts a valid enquiry and normalises the email', () => {
    const r = enquirySchema.safeParse(goodEnquiry);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('jo@example.com');
  });
  it('rejects bad email, short message, unknown option and missing consent', () => {
    const r = enquirySchema.safeParse({ ...goodEnquiry, email: 'nope', message: 'short', budgetRange: 'free', consent: undefined });
    expect(r.success).toBe(false);
    if (!r.success) {
      const paths = r.error.issues.map((i) => i.path.join('.'));
      expect(paths).toEqual(expect.arrayContaining(['email', 'message', 'budgetRange', 'consent']));
    }
  });
  it('rejects obviously invalid phone numbers', () => {
    expect(enquirySchema.safeParse({ ...goodEnquiry, phone: 'abc' }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...goodEnquiry, phone: '+47 55 01 00 00' }).success).toBe(true);
  });
});
