import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app, connect, createUsers, disconnect, loginAs, resetDb, XHR } from './helpers';

beforeAll(async () => {
  await connect();
  await resetDb();
  await createUsers();
});
afterAll(disconnect);

describe('authentication', () => {
  it('logs in with valid credentials and sets an httpOnly cookie, never exposing the hash', async () => {
    const { res } = await loginAs('admin@test.dev');
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/an_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });
  it('rejects wrong passwords, unknown users and disabled accounts with the same message', async () => {
    const msgs = new Set<string>();
    for (const body of [{ email: 'admin@test.dev', password: 'wrong-password' }, { email: 'ghost@test.dev', password: 'whatever12' }, { email: 'off@test.dev', password: 'Passw0rd!Test' }]) {
      const res = await request(app).post('/api/auth/login').set(XHR).send(body);
      expect(res.status).toBe(401);
      msgs.add(res.body.error.message);
    }
    expect(msgs.size).toBe(1);
  });
  it('requires the CSRF header on login', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.dev', password: 'Passw0rd!Test' });
    expect(res.status).toBe(403);
  });
  it('/me returns the session user and logout clears the session', async () => {
    const { agent } = await loginAs('editor@test.dev');
    expect((await agent.get('/api/auth/me')).body.data.user.email).toBe('editor@test.dev');
    await agent.post('/api/auth/logout').set(XHR);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('API permissions', () => {
  const adminPaths = ['/api/admin/enquiries', '/api/admin/users', '/api/admin/settings'];
  const contentPaths = ['/api/admin/projects', '/api/admin/services', '/api/admin/articles', '/api/admin/testimonials', '/api/admin/team', '/api/admin/media', '/api/admin/stats'];

  it('blocks every admin endpoint when signed out', async () => {
    for (const p of [...adminPaths, ...contentPaths]) expect((await request(app).get(p)).status, p).toBe(401);
  });
  it('lets editors manage content but not enquiries, users or settings', async () => {
    const { agent } = await loginAs('editor@test.dev');
    for (const p of contentPaths) expect((await agent.get(p)).status, p).toBe(200);
    for (const p of adminPaths) expect((await agent.get(p)).status, p).toBe(403);
  });
  it('lets admins reach everything', async () => {
    const { agent } = await loginAs('admin@test.dev');
    for (const p of [...adminPaths, ...contentPaths]) expect((await agent.get(p)).status, p).toBe(200);
  });
  it('rejects state-changing admin requests without the CSRF header', async () => {
    const { agent } = await loginAs('admin@test.dev');
    expect((await agent.post('/api/admin/services').send({})).status).toBe(403);
  });
  it('rejects a forged or tampered token', async () => {
    const res = await request(app).get('/api/admin/projects').set('Cookie', 'an_session=abc.def.ghi');
    expect(res.status).toBe(401);
  });
  it('does not allow editors to escalate privileges through the users API', async () => {
    const { agent } = await loginAs('editor@test.dev');
    const res = await agent.post('/api/admin/users').set(XHR).send({ name: 'X Y', email: 'x@y.dev', password: 'Password123', role: 'admin', status: 'active' });
    expect(res.status).toBe(403);
  });
});

describe('user management safeguards', () => {
  it('prevents admins from disabling or deleting themselves, and creates users with hashed passwords', async () => {
    const { agent, res } = await loginAs('admin@test.dev');
    const self = res.body.data.user.id;
    expect((await agent.patch(`/api/admin/users/${self}`).set(XHR).send({ status: 'disabled' })).status).toBe(403);
    expect((await agent.delete(`/api/admin/users/${self}`).set(XHR)).status).toBe(403);
    const created = await agent.post('/api/admin/users').set(XHR).send({ name: 'New Person', email: 'new@test.dev', password: 'LongPassw0rd', role: 'editor', status: 'active' });
    expect(created.status).toBe(201);
    expect(created.body.data.passwordHash).toBeUndefined();
    const weak = await agent.post('/api/admin/users').set(XHR).send({ name: 'Weak', email: 'weak@test.dev', password: 'short', role: 'editor', status: 'active' });
    expect(weak.status).toBe(400);
  });
});
