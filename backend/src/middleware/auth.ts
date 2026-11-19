import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User } from '../models';
import { ah, forbidden, unauthorized } from '../utils/errors';

export const COOKIE_NAME = 'an_session';

export type Role = 'admin' | 'editor';
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
    id?: string;
  }
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.COOKIE_SAMESITE,
    maxAge: config.JWT_EXPIRES_HOURS * 3600 * 1000,
    path: '/',
  } as const;
}

export function signSession(user: { id: string; role: string }) {
  return jwt.sign({ sub: user.id, role: user.role }, config.JWT_SECRET, { expiresIn: `${config.JWT_EXPIRES_HOURS}h` });
}

/** Loads the signed-in user (cookie or Bearer token) and re-checks that the account is still active. */
export const requireAuth = ah(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = req.cookies?.[COOKIE_NAME] || (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (!token) throw unauthorized();
  let payload: any;
  try {
    payload = jwt.verify(token, config.JWT_SECRET);
  } catch {
    throw unauthorized('Your session has expired. Please sign in again.');
  }
  const user = await User.findById(payload.sub);
  if (!user || user.status !== 'active') throw unauthorized('Your account is not active.');
  req.user = { id: user.id, name: user.name, email: user.email, role: user.role as Role };
  next();
});

/** Least-privilege gate: the user's role must be one of the allowed roles. */
export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };

/**
 * CSRF defence for cookie auth: state-changing requests must carry a custom header.
 * Browsers only allow custom headers cross-origin after a CORS pre-flight, which only our allowed origins pass.
 */
export function csrfGuard(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.headers.authorization?.startsWith('Bearer ')) return next();
  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') return next(forbidden('Missing X-Requested-With header.'));
  next();
}
