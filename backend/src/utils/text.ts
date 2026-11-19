import sanitizeHtml from 'sanitize-html';

const entityMap: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" };

/** Strip every HTML tag; keep readable text (React escapes on render, e-mails escape explicitly). */
export function plain(input: string): string {
  const stripped = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {}, disallowedTagsMode: 'discard' });
  return stripped.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (m) => entityMap[m] ?? m).trim();
}

const RICH = {
  allowedTags: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a', 'blockquote', 'br', 'hr', 'figure', 'figcaption', 'img'],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  transformTags: {
    a: (tagName: string, attribs: Record<string, string>) => ({
      tagName,
      attribs: { ...attribs, rel: 'noopener noreferrer', ...(attribs.href?.startsWith('http') ? { target: '_blank' } : {}) },
    }),
    img: (tagName: string, attribs: Record<string, string>) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } }),
  },
};

/** Sanitise rich text (articles / service descriptions). */
export function rich(input: string): string {
  return sanitizeHtml(input, RICH as any).trim();
}

export function htmlEscape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

export function stripToText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();
}

export function readingTimeMinutes(html: string): number {
  const words = stripToText(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
