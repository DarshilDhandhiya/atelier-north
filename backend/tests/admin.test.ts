import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app, connect, createUsers, disconnect, loginAs, PNG, resetDb, validProject, XHR } from './helpers';
import { img } from '../src/seed/images';

let editor: Awaited<ReturnType<typeof loginAs>>['agent'];

beforeAll(async () => {
  await connect();
  await resetDb();
  await createUsers();
  editor = (await loginAs('editor@test.dev')).agent;
});
afterAll(disconnect);

describe('admin CRUD – projects', () => {
  let id = '';
  it('creates a draft with an automatic unique slug', async () => {
    const a = await editor.post('/api/admin/projects').set(XHR).send(validProject());
    expect(a.status).toBe(201);
    expect(a.body.data.slug).toBe('test-house');
    expect(a.body.data.publishedAt).toBeNull();
    id = a.body.data.id;
    const b = await editor.post('/api/admin/projects').set(XHR).send(validProject());
    expect(b.body.data.slug).toBe('test-house-2');
  });
  it('treats an empty slug from the form as "generate one"', async () => {
    const r = await editor.post('/api/admin/projects').set(XHR).send({ ...validProject(), title: 'Blank Slug House', slug: '' });
    expect(r.status).toBe(201);
    expect(r.body.data.slug).toBe('blank-slug-house');
    await editor.delete(`/api/admin/projects/${r.body.data.id}`).set(XHR);
  });
  it('keeps drafts out of the public API, then publishes and unpublishes', async () => {
    expect((await request(app).get('/api/projects/test-house')).status).toBe(404);
    const pub = await editor.post(`/api/admin/projects/${id}/publish`).set(XHR);
    expect(pub.status).toBe(200);
    expect(pub.body.data.publishedAt).toBeTruthy();
    expect((await request(app).get('/api/projects/test-house')).status).toBe(200);
    await editor.post(`/api/admin/projects/${id}/unpublish`).set(XHR);
    expect((await request(app).get('/api/projects/test-house')).status).toBe(404);
  });
  it('validates input with field-level errors', async () => {
    const res = await editor.post('/api/admin/projects').set(XHR).send(validProject({ title: 'x', year: 1700, coverImage: { url: 'javascript:alert(1)', alt: '' } }));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const paths = res.body.error.details.map((d: any) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['title', 'year', 'coverImage.url', 'coverImage.alt']));
  });
  it('requires alt text on images', async () => {
    const res = await editor.post('/api/admin/projects').set(XHR).send(validProject({ coverImage: { ...img(30484316, ''), alt: '' } }));
    expect(res.status).toBe(400);
  });
  it('updates partially without resetting other fields', async () => {
    await editor.patch(`/api/admin/projects/${id}`).set(XHR).send({ featured: true, featuredOrder: 2 });
    const res = await editor.put(`/api/admin/projects/${id}`).set(XHR).send({ title: 'Renamed House' });
    expect(res.body.data.title).toBe('Renamed House');
    expect(res.body.data.featured).toBe(true);
    expect(res.body.data.areaSqFt).toBe(2000);
  });
  it('strips HTML from plain-text fields', async () => {
    const res = await editor.post('/api/admin/projects').set(XHR).send(validProject({ title: 'Safe <script>alert(1)</script>Title' }));
    expect(res.body.data.title).toBe('Safe Title');
  });
  it('reorders featured projects', async () => {
    const list = await editor.get('/api/admin/projects');
    const ids = list.body.data.map((p: any) => p.id) as string[];
    const res = await editor.put('/api/admin/projects/featured-order').set(XHR).send({ ids: [ids[1], ids[0]] });
    expect(res.status).toBe(200);
    await request(app).get('/api/projects/filters');
    const check = await editor.get('/api/admin/projects');
    const featured = check.body.data.filter((p: any) => p.featured).sort((a: any, b: any) => a.featuredOrder - b.featuredOrder);
    expect(featured.map((p: any) => p.id)).toEqual([ids[1], ids[0]]);
  });
  it('searches and filters the admin list by status', async () => {
    const drafts = await editor.get('/api/admin/projects').query({ status: 'draft' });
    expect(drafts.body.meta.total).toBeGreaterThan(0);
    const q = await editor.get('/api/admin/projects').query({ q: 'renamed' });
    expect(q.body.data).toHaveLength(1);
  });
  it('deletes a project', async () => {
    expect((await editor.delete(`/api/admin/projects/${id}`).set(XHR)).status).toBe(200);
    expect((await editor.get(`/api/admin/projects/${id}`)).status).toBe(404);
  });
  it('returns 400 for malformed ids', async () => {
    expect((await editor.get('/api/admin/projects/not-an-id')).status).toBe(400);
  });
});

describe('admin CRUD – articles, services, testimonials', () => {
  it('sanitises rich text and computes reading time', async () => {
    const res = await editor.post('/api/admin/articles').set(XHR).send({
      title: 'A new article', excerpt: 'Short excerpt', category: 'Process', author: 'Ingrid', tags: [], publishedAt: null,
      coverImage: img(9617366, 'Drafting desk'), body: '<p onmouseover="x()">Hello <b>world</b></p><script>alert(1)</script><img src=x onerror=alert(1)>',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.body).not.toMatch(/script|onerror|onmouseover/i);
    expect(res.body.data.readingTime).toBe(1);
  });
  it('creates a service and reorders services', async () => {
    const mk = (title: string) => editor.post('/api/admin/services').set(XHR).send({ title, summary: 's', description: '<p>desc</p>', deliverables: [], steps: [], faq: [], heroImage: null, order: 0, published: true });
    const a = (await mk('Alpha service')).body.data.id;
    const b = (await mk('Beta service')).body.data.id;
    expect((await editor.put('/api/admin/services/order').set(XHR).send({ ids: [b, a] })).status).toBe(200);
    const pub = await request(app).get('/api/services');
    expect(pub.body.data.map((s: any) => s.title)).toEqual(['Beta service', 'Alpha service']);
  });
  it('only shows approved testimonials publicly', async () => {
    const mk = (name: string, approved: boolean) => editor.post('/api/admin/testimonials').set(XHR).send({ name, role: 'Client', quote: 'Wonderful team to work with.', projectId: null, approved, order: 0 });
    await mk('Approved Person', true);
    await mk('Pending Person', false);
    const res = await request(app).get('/api/testimonials');
    expect(res.body.data.map((t: any) => t.name)).toEqual(['Approved Person']);
  });
});

describe('media uploads', () => {
  it('stores a valid image and records dimensions, alt text and attribution', async () => {
    const res = await editor.post('/api/admin/media').set(XHR).attach('file', PNG, { filename: 'plan.png', contentType: 'image/png' }).field('alt', 'A tiny test image');
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ width: 1, height: 1, mimeType: 'image/png', alt: 'A tiny test image' });
    const file = await request(app).get(new URL(res.body.data.url).pathname);
    expect(file.status).toBe(200);
    expect((await editor.delete(`/api/admin/media/${res.body.data.id}`).set(XHR)).status).toBe(200);
  });
  it('rejects a script renamed to .png (content check, not extension)', async () => {
    const res = await editor.post('/api/admin/media').set(XHR).attach('file', Buffer.from('<?php system($_GET["c"]); ?> padding padding'), { filename: 'evil.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
  });
  it('rejects uploads without a file', async () => {
    expect((await editor.post('/api/admin/media').set(XHR).field('alt', 'x')).status).toBe(400);
  });
});
