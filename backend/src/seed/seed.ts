/**
 * Idempotent seed script: safe to run repeatedly (upserts by slug / email / name – no duplicates).
 *   npm run seed            -> create or update demo content + demo users
 *   npm run seed -- --reset -> wipe content collections first (users and enquiries are kept)
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { config } from '../config';
import { Article, Media, Project, Service, SiteSettings, TeamMember, Testimonial, User } from '../models';
import { articles, projects, services, settings, team, testimonials } from './content';
import { readingTimeMinutes } from '../utils/text';

async function main() {
  const reset = process.argv.includes('--reset');
  if (config.isProd && config.SEED_ADMIN_PASSWORD === 'Atelier!Admin2026') {
    throw new Error('Refusing to seed production with the default demo password. Set SEED_ADMIN_PASSWORD (and SEED_EDITOR_PASSWORD).');
  }
  await mongoose.connect(config.MONGODB_URI);
  console.log('Connected to', config.MONGODB_URI.replace(/\/\/.*@/, '//***@'));

  if (reset) {
    await Promise.all([Project.deleteMany({}), Service.deleteMany({}), Article.deleteMany({}), Testimonial.deleteMany({}), TeamMember.deleteMany({}), SiteSettings.deleteMany({}), Media.deleteMany({})]);
    console.log('Content collections cleared.');
  }
  await mongoose.syncIndexes();

  // Users
  for (const u of [
    { name: 'Studio Admin', email: config.SEED_ADMIN_EMAIL, password: config.SEED_ADMIN_PASSWORD, role: 'admin' },
    { name: 'Content Editor', email: config.SEED_EDITOR_EMAIL, password: config.SEED_EDITOR_PASSWORD, role: 'editor' },
  ]) {
    const existing = await User.findOne({ email: u.email });
    if (!existing) await User.create({ name: u.name, email: u.email, role: u.role, status: 'active', passwordHash: await bcrypt.hash(u.password, 12) });
  }

  // Projects
  for (const p of projects) await Project.findOneAndUpdate({ slug: p.slug }, { ...p, demo: true }, { upsert: true, new: true, setDefaultsOnInsert: true });
  // Services
  for (const s of services) await Service.findOneAndUpdate({ slug: s.slug }, { ...s, published: true }, { upsert: true, new: true, setDefaultsOnInsert: true });
  // Articles (readingTime computed here because findOneAndUpdate skips document hooks)
  for (const a of articles) await Article.findOneAndUpdate({ slug: a.slug }, { ...a, readingTime: readingTimeMinutes(a.body) }, { upsert: true, new: true, setDefaultsOnInsert: true });
  // Team
  for (const t of team) await TeamMember.findOneAndUpdate({ name: t.name }, { ...t, published: true }, { upsert: true, new: true, setDefaultsOnInsert: true });
  // Testimonials (linked to projects by slug)
  for (const { projectSlug, ...t } of testimonials) {
    const project = await Project.findOne({ slug: projectSlug });
    await Testimonial.findOneAndUpdate({ name: t.name }, { ...t, projectId: project?._id ?? null, approved: true }, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  // Settings
  await SiteSettings.findOneAndUpdate({ key: 'main' }, settings, { upsert: true, new: true, setDefaultsOnInsert: true });

  const counts = {
    projects: await Project.countDocuments(),
    services: await Service.countDocuments(),
    articles: await Article.countDocuments(),
    testimonials: await Testimonial.countDocuments(),
    team: await TeamMember.countDocuments(),
    users: await User.countDocuments(),
  };
  console.log('Seed complete:', counts);
  console.log(`Demo admin:  ${config.SEED_ADMIN_EMAIL} / ${config.isProd ? '(from env)' : config.SEED_ADMIN_PASSWORD}`);
  console.log(`Demo editor: ${config.SEED_EDITOR_EMAIL} / ${config.isProd ? '(from env)' : config.SEED_EDITOR_PASSWORD}`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('Seed failed:', e);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
