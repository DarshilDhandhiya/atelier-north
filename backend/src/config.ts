import 'dotenv/config';
import { z } from 'zod';

const bool = z
  .enum(['true', 'false'])
  .optional()
  .transform((v) => v === 'true');

const DEV_SECRET = 'dev-only-secret-change-me-please-0123456789';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(5000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/atelier_north'),
  JWT_SECRET: z.string().default(DEV_SECRET),
  JWT_EXPIRES_HOURS: z.coerce.number().default(8),
  CLIENT_ORIGINS: z.string().default('http://localhost:5173'),
  SITE_URL: z.string().default('http://localhost:5173'),
  PUBLIC_API_URL: z.string().default('http://localhost:5000'),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_SECURE: bool,
  TRUST_PROXY: bool,
  FORCE_HTTPS: bool,
  STORAGE_DRIVER: z.enum(['local', 'cloudinary']).default('local'),
  UPLOAD_DIR: z.string().default('uploads'),
  CLOUDINARY_URL: z.string().optional(),
  MAX_IMAGE_MB: z.coerce.number().default(8),
  MAX_ATTACHMENT_MB: z.coerce.number().default(10),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: bool,
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('Atelier North <no-reply@atelier-north.example>'),
  STAFF_NOTIFY_EMAIL: z.string().default('studio@atelier-north.example'),
  SEND_CUSTOMER_ACK: bool,
  EMAIL_RETRY_INTERVAL_MIN: z.coerce.number().default(5),
  EMAIL_MAX_ATTEMPTS: z.coerce.number().default(5),
  ENQUIRY_RATE_LIMIT_MAX: z.coerce.number().default(5),
  ENQUIRY_RATE_LIMIT_WINDOW_MIN: z.coerce.number().default(60),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(10),
  SEED_ADMIN_EMAIL: z.string().default('admin@atelier-north.test'),
  SEED_ADMIN_PASSWORD: z.string().default('Atelier!Admin2026'),
  SEED_EDITOR_EMAIL: z.string().default('editor@atelier-north.test'),
  SEED_EDITOR_PASSWORD: z.string().default('Atelier!Editor2026'),
});

// Treat empty strings in .env (e.g. "SMTP_HOST=") as "not set"
const cleaned = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== '' && v !== undefined));
const parsed = schema.safeParse(cleaned);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const i of parsed.error.issues) console.error(` - ${i.path.join('.')}: ${i.message}`);
  process.exit(1);
}

const env = parsed.data;
const isProd = env.NODE_ENV === 'production';

if (isProd && (env.JWT_SECRET === DEV_SECRET || env.JWT_SECRET.length < 32)) {
  console.error('JWT_SECRET must be a unique random value of at least 32 characters in production.');
  process.exit(1);
}

export const config = {
  ...env,
  isProd,
  isTest: env.NODE_ENV === 'test',
  clientOrigins: env.CLIENT_ORIGINS.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean),
  siteUrl: env.SITE_URL.replace(/\/$/, ''),
  publicApiUrl: env.PUBLIC_API_URL.replace(/\/$/, ''),
  cookieSecure: env.COOKIE_SECURE || isProd,
};

export type Config = typeof config;
