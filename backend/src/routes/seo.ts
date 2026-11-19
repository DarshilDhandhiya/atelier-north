import { Router } from 'express';
import { Article, Project, Service } from '../models';
import { config } from '../config';
import { ah } from '../utils/errors';
import { htmlEscape } from '../utils/text';
import { publishedFilter } from '../utils/helpers';

const r = Router();

r.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
});

r.get(
  '/sitemap.xml',
  ah(async (_req, res) => {
    const [projects, services, articles] = await Promise.all([
      Project.find(publishedFilter()).select('slug updatedAt'),
      Service.find({ published: true }).select('slug updatedAt'),
      Article.find(publishedFilter()).select('slug updatedAt'),
    ]);
    const urls: { loc: string; lastmod?: Date; priority: string }[] = [
      { loc: '/', priority: '1.0' },
      { loc: '/projects', priority: '0.9' },
      { loc: '/services', priority: '0.8' },
      { loc: '/about', priority: '0.7' },
      { loc: '/journal', priority: '0.7' },
      { loc: '/contact', priority: '0.9' },
      { loc: '/privacy', priority: '0.2' },
      ...projects.map((p) => ({ loc: `/projects/${p.slug}`, lastmod: (p as any).updatedAt, priority: '0.8' })),
      ...services.map((s) => ({ loc: `/services/${s.slug}`, lastmod: (s as any).updatedAt, priority: '0.7' })),
      ...articles.map((a) => ({ loc: `/journal/${a.slug}`, lastmod: (a as any).updatedAt, priority: '0.6' })),
    ];
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls
        .map((u) => `  <url><loc>${htmlEscape(config.siteUrl + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.toISOString()}</lastmod>` : ''}<priority>${u.priority}</priority></url>`)
        .join('\n') +
      `\n</urlset>\n`;
    res.set('Cache-Control', 'public, max-age=3600').type('application/xml').send(xml);
  }),
);

export default r;
