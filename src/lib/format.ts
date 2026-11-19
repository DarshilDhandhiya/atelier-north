export const formatArea = (n: number) => `${n.toLocaleString('en-GB')} sq ft`;

export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

export const formatDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

/** Split text on blank lines into paragraphs. */
export const paragraphs = (text?: string) => (text ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

export const prettifySlug = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(' ');

export const projectTypeForService = (slug?: string): string | undefined => {
  if (!slug) return undefined;
  if (slug.includes('architect')) return 'Architecture';
  if (slug.includes('interior')) return 'Interior design';
  if (slug.includes('renovat')) return 'Renovation';
  return undefined;
};
