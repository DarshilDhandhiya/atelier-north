import crypto from 'node:crypto';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { config } from './config';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import enquiryRoutes from './routes/enquiries';
import publicRoutes from './routes/public';
import seoRoutes from './routes/seo';
import { uploadDir } from './services/storage';
import { errorHandler } from './utils/errors';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.TRUST_PROXY) app.set('trust proxy', 1);

  // Request id + request logging
  app.use((req, res, next) => {
    req.id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
  });
  morgan.token('id', (req: any) => req.id);
  if (!config.isTest) app.use(morgan(config.isProd ? ':id :remote-addr :method :url :status :res[content-length] - :response-time ms' : 'dev'));

  // HTTPS everywhere in production (behind a proxy, set TRUST_PROXY=true)
  if (config.FORCE_HTTPS) {
    app.use((req, res, next) => (req.secure ? next() : res.redirect(308, `https://${req.headers.host}${req.originalUrl}`)));
  }

  // Secure headers (HSTS is enabled automatically over HTTPS in production)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // uploaded images are used by the frontend origin
      hsts: config.isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );

  // Restricted CORS: only the configured frontend origins may call the API with credentials
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || config.clientOrigins.includes(origin)) return cb(null, true);
        cb(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Requested-With', 'Authorization'],
      maxAge: 600,
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/uploads', express.static(uploadDir, { maxAge: '365d', immutable: true, index: false, dotfiles: 'deny' }));

  app.get('/api/health', (_req, res) => {
    res.set('Cache-Control', 'no-store').json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', uptime: Math.round(process.uptime()) });
  });

  app.use('/', seoRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/enquiries', enquiryRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', publicRoutes);

  app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'That API route does not exist.' } }));
  app.use(errorHandler);
  return app;
}
