import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { COOKIE_NAME, cookieOptions, csrfGuard, requireAuth, signSession } from '../middleware/auth';
import { User } from '../models';
import { loginSchema } from '../schemas';
import { ah, parse } from '../utils/errors';
import { noStore } from '../utils/helpers';

const r = Router();
r.use(noStore);

// A valid bcrypt hash used to keep response time similar when the e-mail does not exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: config.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => config.isTest && process.env.TEST_RATE_LIMIT !== 'on',
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many sign-in attempts. Try again in 15 minutes.' } }),
});

r.post(
  '/login',
  csrfGuard,
  loginLimiter,
  ah(async (req, res) => {
    const { email, password } = parse<{ email: string; password: string }>(loginSchema, req.body);
    const user = await User.findOne({ email });
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok || user.status !== 'active') {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'That email and password do not match an active account.' } });
    }
    user.lastLoginAt = new Date();
    await user.save();
    res.cookie(COOKIE_NAME, signSession({ id: String(user._id), role: user.role }), cookieOptions());
    res.json({ data: { user } });
  }),
);

r.post('/logout', csrfGuard, (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
  res.json({ data: { ok: true } });
});

r.get(
  '/me',
  requireAuth,
  ah(async (req, res) => {
    const user = await User.findById(req.user!.id);
    res.json({ data: { user } });
  }),
);

export default r;
