import type { Model } from 'mongoose';
import { slugify } from './text';

export function paging(query: Record<string, unknown>, defaultLimit = 12, maxLimit = 100) {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(query.limit ?? defaultLimit), 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export function meta(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/** Returns `base`, or `base-2`, `base-3`... so the slug is unique within the model. */
export async function uniqueSlug(model: Model<any>, base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'item';
  let candidate = root;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await model.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}

export const publishedFilter = () => ({ publishedAt: { $ne: null, $lte: new Date() } });

/** Public caching: shared caches may keep it briefly; browsers revalidate with the ETag. */
export const publicCache = (seconds = 60) => (_req: any, res: any, next: any) => {
  res.set('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=300`);
  next();
};
export const noStore = (_req: any, res: any, next: any) => {
  res.set('Cache-Control', 'no-store');
  next();
};
