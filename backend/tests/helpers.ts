import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app';
import { Project, User } from '../src/models';
import { img } from '../src/seed/images';

export const app = createApp();
export const XHR = { 'X-Requested-With': 'XMLHttpRequest' };

export async function connect() {
  if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.TEST_MONGODB_URI!);
}
export async function disconnect() {
  await mongoose.disconnect();
}
export async function resetDb() {
  const cols = await mongoose.connection.db!.collections();
  await Promise.all(cols.map((c) => c.deleteMany({})));
}

export async function createUsers() {
  const passwordHash = await bcrypt.hash('Passw0rd!Test', 4);
  await User.create([
    { name: 'Test Admin', email: 'admin@test.dev', role: 'admin', status: 'active', passwordHash },
    { name: 'Test Editor', email: 'editor@test.dev', role: 'editor', status: 'active', passwordHash },
    { name: 'Disabled', email: 'off@test.dev', role: 'editor', status: 'disabled', passwordHash },
  ]);
}

export async function loginAs(email: string) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').set(XHR).send({ email, password: 'Passw0rd!Test' });
  return { agent, res };
}

export const validProject = (over: Record<string, unknown> = {}) => ({
  title: 'Test House',
  category: 'Residential',
  location: 'Oslo, Norway',
  year: 2024,
  areaSqFt: 2000,
  summary: 'A test summary that is long enough.',
  brief: 'A test brief that is long enough to pass.',
  approach: 'A test approach that is long enough to pass.',
  scope: ['Design'],
  coverImage: img(30484316, 'A house with a timber entrance'),
  gallery: [],
  tags: ['test'],
  featured: false,
  featuredOrder: 0,
  publishedAt: null,
  demo: true,
  ...over,
});

export async function seedProjects() {
  const mk = (title: string, category: string, location: string, year: number, area: number, published = true) =>
    Project.create({ ...validProject({ title, category, location, year, areaSqFt: area }), slug: title.toLowerCase().replace(/\W+/g, '-'), publishedAt: published ? new Date('2025-01-01') : null });
  await mk('Alpha House', 'Residential', 'Bergen, Norway', 2022, 1000);
  await mk('Beta Hotel', 'Hospitality', 'Oslo, Norway', 2023, 5000);
  await mk('Gamma Office', 'Workplace', 'Bergen, Norway', 2024, 3000);
  await mk('Delta Loft', 'Residential', 'Lisbon, Portugal', 2021, 800);
  await mk('Hidden Draft', 'Residential', 'Bergen, Norway', 2025, 900, false);
}

export const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
