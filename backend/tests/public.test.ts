import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app, connect, disconnect, resetDb, seedProjects } from './helpers';

beforeAll(async () => {
  await connect();
  await resetDb();
  await seedProjects();
});
afterAll(disconnect);

describe('GET /api/projects', () => {
  it('lists only published projects with pagination meta', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(4);
    expect(res.body.data.map((p: any) => p.slug)).not.toContain('hidden-draft');
  });
  it('filters by category', async () => {
    const res = await request(app).get('/api/projects').query({ category: 'Residential' });
    expect(res.body.data.map((p: any) => p.title).sort()).toEqual(['Alpha House', 'Delta Loft']);
  });
  it('filters by location', async () => {
    const res = await request(app).get('/api/projects').query({ location: 'Bergen, Norway' });
    expect(res.body.data.map((p: any) => p.title).sort()).toEqual(['Alpha House', 'Gamma Office']);
  });
  it('combines category and location filters', async () => {
    const res = await request(app).get('/api/projects').query({ category: 'Residential', location: 'Lisbon, Portugal' });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Delta Loft');
  });
  it('searches title, case-insensitively, and escapes regex characters', async () => {
    expect((await request(app).get('/api/projects').query({ q: 'hotel' })).body.data).toHaveLength(1);
    const odd = await request(app).get('/api/projects').query({ q: '.*' });
    expect(odd.status).toBe(200);
    expect(odd.body.data).toHaveLength(0);
  });
  it('sorts by size and by year', async () => {
    const big = await request(app).get('/api/projects').query({ sort: 'largest' });
    expect(big.body.data.map((p: any) => p.areaSqFt)).toEqual([5000, 3000, 1000, 800]);
    const old = await request(app).get('/api/projects').query({ sort: 'oldest' });
    expect(old.body.data[0].year).toBe(2021);
  });
  it('paginates', async () => {
    const p2 = await request(app).get('/api/projects').query({ limit: 3, page: 2 });
    expect(p2.body.meta).toMatchObject({ page: 2, limit: 3, total: 4, totalPages: 2 });
    expect(p2.body.data).toHaveLength(1);
  });
  it('returns facet values for the filters', async () => {
    const res = await request(app).get('/api/projects/filters');
    expect(res.body.data.categories).toEqual(['Hospitality', 'Residential', 'Workplace']);
    expect(res.body.data.locations).toContain('Lisbon, Portugal');
  });
});

describe('GET /api/projects/:slug', () => {
  it('returns the project and related projects', async () => {
    const res = await request(app).get('/api/projects/alpha-house');
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Alpha House');
    expect(res.body.related.length).toBeGreaterThan(0);
    expect(res.body.related.map((p: any) => p.slug)).not.toContain('alpha-house');
  });
  it('404s for unknown and for unpublished projects', async () => {
    expect((await request(app).get('/api/projects/nope')).status).toBe(404);
    const draft = await request(app).get('/api/projects/hidden-draft');
    expect(draft.status).toBe(404);
    expect(draft.body.error.code).toBe('NOT_FOUND');
  });
});

describe('misc public endpoints', () => {
  it('exposes enquiry options', async () => {
    const res = await request(app).get('/api/meta/enquiry-options');
    expect(res.body.data.projectTypes).toContain('Renovation');
  });
  it('serves a sitemap with published projects only, and robots.txt', async () => {
    const xml = await request(app).get('/sitemap.xml');
    expect(xml.status).toBe(200);
    expect(xml.text).toContain('/projects/alpha-house');
    expect(xml.text).not.toContain('hidden-draft');
    const robots = await request(app).get('/robots.txt');
    expect(robots.text).toContain('Disallow: /admin');
    expect(robots.text).toContain('Sitemap:');
  });
  it('returns consistent JSON errors for unknown API routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
  it('sets security headers and hides the framework', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
  it('only allows configured CORS origins', async () => {
    const ok = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const bad = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });
});
