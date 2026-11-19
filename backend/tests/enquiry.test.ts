import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { app, connect, createUsers, disconnect, loginAs, PNG, resetDb, XHR } from './helpers';
import { Enquiry } from '../src/models';
import { retryFailedEmails, setTransport } from '../src/services/mailer';

const good = {
  name: 'Jo Bloggs', email: 'jo@example.com', phone: '+47 55 01 00 00', projectType: 'Renovation', location: 'Bergen, Norway',
  budgetRange: '$50k – $150k', timeline: 'Within 3–6 months', message: 'We would like to renovate our kitchen and add a small study.', consent: 'true',
};
const post = (fields: Record<string, string> = {}) => {
  const r = request(app).post('/api/enquiries');
  for (const [k, v] of Object.entries({ ...good, ...fields })) if (v !== undefined) r.field(k, v);
  return r;
};

let sendMail: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  await connect();
  await createUsers().catch(() => undefined);
});
afterAll(async () => {
  setTransport(null);
  await disconnect();
});
beforeEach(async () => {
  await Enquiry.deleteMany({});
  sendMail = vi.fn().mockResolvedValue({ messageId: 'x' });
  setTransport({ sendMail } as any);
});

describe('POST /api/enquiries', () => {
  it('saves the enquiry, returns a reference ID and notifies staff', async () => {
    const res = await post();
    expect(res.status).toBe(201);
    expect(res.body.data.reference).toMatch(/^AN-\d{6}-[A-Z2-9]{4}$/);
    const saved = await Enquiry.findOne({ reference: res.body.data.reference });
    expect(saved).toMatchObject({ name: 'Jo Bloggs', status: 'new', emailStatus: 'sent', emailAttempts: 1 });
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].subject).toContain(res.body.data.reference);
  });
  it('returns field-level validation errors', async () => {
    const res = await post({ email: 'bad', message: 'too short', consent: 'false' });
    expect(res.status).toBe(400);
    const paths = res.body.error.details.map((d: any) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['email', 'message', 'consent']));
    expect(await Enquiry.countDocuments()).toBe(0);
  });
  it('escapes HTML in the staff e-mail so submitted markup cannot inject content', async () => {
    await post({ name: 'Eve <img src=x onerror=alert(1)>', message: 'Hello <script>alert(1)</script> there, this is long enough.' });
    const html: string = sendMail.mock.calls[0][0].html;
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
  });
  it('silently drops honeypot submissions without saving or e-mailing', async () => {
    const res = await post({ website: 'http://spam.example' });
    expect(res.status).toBe(201);
    expect(await Enquiry.countDocuments()).toBe(0);
    expect(sendMail).not.toHaveBeenCalled();
  });
  it('drops submissions that were completed implausibly fast', async () => {
    const res = await post({ formStartedAt: String(Date.now() - 300) });
    expect(res.status).toBe(201);
    expect(await Enquiry.countDocuments()).toBe(0);
  });
  it('accepts a slow, human submission', async () => {
    await post({ formStartedAt: String(Date.now() - 20000) });
    expect(await Enquiry.countDocuments()).toBe(1);
  });
  it('rejects link-stuffed messages', async () => {
    const res = await post({ message: 'Visit http://a.com and http://b.com and http://c.com for cheap deals today please' });
    expect(res.status).toBe(400);
  });
  it('is idempotent: a double submit within 10 minutes returns the same reference', async () => {
    const a = await post();
    const b = await post();
    expect(b.body.data.reference).toBe(a.body.data.reference);
    expect(await Enquiry.countDocuments()).toBe(1);
  });

  describe('attachments', () => {
    it('accepts a valid image, stores it privately and exposes it only to admins', async () => {
      const res = await post().attach('attachment', PNG, { filename: 'site-plan.png', contentType: 'image/png' });
      expect(res.status).toBe(201);
      const saved = await Enquiry.findOne({ reference: res.body.data.reference });
      expect(saved?.attachment?.originalName).toBe('site-plan.png');
      expect(saved?.attachmentUrl).toBe(`/api/admin/enquiries/${saved!.id}/attachment`);
      expect((await request(app).get(saved!.attachmentUrl!)).status).toBe(401);
      const { agent } = await loginAs('admin@test.dev');
      const dl = await agent.get(saved!.attachmentUrl!);
      expect(dl.status).toBe(200);
      expect(dl.headers['content-type']).toContain('image/png');
      expect(dl.headers['content-disposition']).toContain('attachment');
      const { agent: editor } = await loginAs('editor@test.dev');
      expect((await editor.get(saved!.attachmentUrl!)).status).toBe(403);
    });
    it('rejects executables and scripts disguised with an image extension', async () => {
      const res = await post().attach('attachment', Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00 fake exe'), { filename: 'photo.jpg', contentType: 'image/jpeg' });
      expect(res.status).toBe(400);
      expect(await Enquiry.countDocuments()).toBe(0);
    });
    it('rejects files over the size limit', async () => {
      const big = Buffer.concat([PNG, Buffer.alloc(11 * 1024 * 1024)]);
      const res = await post().attach('attachment', big, { filename: 'huge.png', contentType: 'image/png' });
      expect(res.status).toBe(413);
    });
  });
});

describe('e-mail failure handling', () => {
  it('keeps the enquiry and records a retryable error when delivery fails', async () => {
    sendMail.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:587'));
    const res = await post();
    expect(res.status).toBe(201); // visitor still sees success
    const saved = await Enquiry.findOne({ reference: res.body.data.reference });
    expect(saved).toMatchObject({ emailStatus: 'failed', emailAttempts: 1 });
    expect(saved?.emailError).toContain('ECONNREFUSED');
    expect(saved?.emailNextRetryAt).toBeTruthy();
  });
  it('retries automatically once the back-off has elapsed and succeeds', async () => {
    sendMail.mockRejectedValueOnce(new Error('smtp down'));
    const res = await post();
    await Enquiry.updateOne({ reference: res.body.data.reference }, { emailNextRetryAt: new Date(Date.now() - 1000) });
    const processed = await retryFailedEmails();
    expect(processed).toBe(1);
    expect(await Enquiry.findOne({ reference: res.body.data.reference })).toMatchObject({ emailStatus: 'sent', emailAttempts: 2 });
  });
  it('lets an admin retry manually', async () => {
    sendMail.mockRejectedValueOnce(new Error('smtp down'));
    const res = await post();
    const saved = (await Enquiry.findOne({ reference: res.body.data.reference }))!;
    const { agent } = await loginAs('admin@test.dev');
    const retry = await agent.post(`/api/admin/enquiries/${saved.id}/retry-email`).set(XHR);
    expect(retry.status).toBe(200);
    expect(retry.body.data.emailStatus).toBe('sent');
    expect((await agent.post(`/api/admin/enquiries/${saved.id}/retry-email`).set(XHR)).status).toBe(409);
  });
});

describe('enquiry admin workflow', () => {
  it('lists with search and status filters, updates status/assignee and records notes', async () => {
    await post();
    await post({ name: 'Sam Other', email: 'sam@example.com', message: 'A different project entirely, a hotel lobby refit.' });
    const { agent, res: login } = await loginAs('admin@test.dev');
    const list = await agent.get('/api/admin/enquiries');
    expect(list.body.meta.total).toBe(2);
    expect(list.body.counts.new).toBe(2);
    expect((await agent.get('/api/admin/enquiries').query({ q: 'hotel' })).body.data).toHaveLength(1);
    const id = list.body.data[0].id;
    const upd = await agent.patch(`/api/admin/enquiries/${id}`).set(XHR).send({ status: 'qualified', assignee: login.body.data.user.id });
    expect(upd.body.data.status).toBe('qualified');
    expect(upd.body.data.assignee.name).toBe('Test Admin');
    expect((await agent.patch(`/api/admin/enquiries/${id}`).set(XHR).send({ status: 'bogus' })).status).toBe(400);
    const note = await agent.post(`/api/admin/enquiries/${id}/notes`).set(XHR).send({ body: 'Called client, site visit booked.' });
    expect(note.body.data.notes).toHaveLength(1);
    expect(note.body.data.notes[0].authorName).toBe('Test Admin');
    expect((await agent.get('/api/admin/enquiries').query({ status: 'qualified' })).body.data).toHaveLength(1);
  });
  it('exports CSV and neutralises spreadsheet formulas', async () => {
    await post({ name: '=HYPERLINK("http://evil.example","click")' });
    const { agent } = await loginAs('admin@test.dev');
    const csv = await agent.get('/api/admin/enquiries/export.csv');
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.text).toContain(`"'=HYPERLINK`);
  });
});

describe('rate limiting', () => {
  it('returns 429 after too many submissions from one address', async () => {
    process.env.TEST_RATE_LIMIT = 'on';
    const codes: number[] = [];
    for (let i = 0; i < 7; i++) codes.push((await post({ message: `Distinct message number ${i} for the rate limit test.` })).status);
    delete process.env.TEST_RATE_LIMIT;
    expect(codes.slice(0, 5).every((c) => c === 201)).toBe(true);
    expect(codes.slice(5)).toContain(429);
  });
});
