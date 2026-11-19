import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ProjectCard } from '../components/Cards';
import { Frame } from '../components/Img';
import { Lightbox } from '../components/Lightbox';
import { ErrorState, PageSkeleton } from '../components/States';
import { useApi } from '../lib/api';
import { formatArea, paragraphs } from '../lib/format';
import { sizedUrl } from '../lib/images';
import { siteOrigin, useSeo } from '../lib/seo';
import type { Project } from '../lib/types';
import NotFound from './NotFound';

const typeFor = (category: string) => (category === 'Renovation' ? 'Renovation' : 'Architecture + interiors');

export default function ProjectDetail() {
  const { slug } = useParams();
  const { data, error, loading, reload } = useApi<{ data: Project; related: Project[] }>(`/api/projects/${slug}`);
  const [lb, setLb] = useState<number | null>(null);
  const close = useCallback(() => setLb(null), []);
  const p = data?.data;

  useSeo({
    title: p?.seo?.title || p?.title,
    description: p?.seo?.description || p?.summary,
    image: p?.seo?.ogImage || p?.coverImage.url,
    path: `/projects/${slug}`,
    noindex: !p && !loading,
    jsonLd: p
      ? {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: p.title,
          description: p.summary,
          image: sizedUrl(p.coverImage.url, 1200, 800),
          dateCreated: String(p.year),
          locationCreated: p.location,
          url: `${siteOrigin()}/projects/${p.slug}`,
        }
      : undefined,
  });

  if (loading) return <PageSkeleton />;
  if (error?.status === 404) return <NotFound what="project" />;
  if (error || !p) return <div className="container"><ErrorState error={error} onRetry={reload} title="We could not load this project" /></div>;

  const images = [p.coverImage, ...p.gallery];
  return (
    <article>
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb" style={{ paddingTop: 'var(--s-5)' }}>
          <ol>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/projects">Projects</Link></li>
            <li aria-current="page">{p.title}</li>
          </ol>
        </nav>
        <header className="detail-head">
          <h1>{p.title}</h1>
          <p className="lead">{p.summary}</p>
          <dl className="title-block">
            <div><dt>Location</dt><dd>{p.location}</dd></div>
            <div><dt>Year</dt><dd>{p.year}</dd></div>
            <div><dt>Area</dt><dd>{formatArea(p.areaSqFt)}</dd></div>
            <div><dt>Category</dt><dd>{p.category}</dd></div>
          </dl>
        </header>
        <button type="button" onClick={() => setLb(0)} style={{ display: 'block', width: '100%', padding: 0, border: 0, background: 'none' }} aria-label={`Open image gallery: ${p.coverImage.alt}`}>
          <Frame image={p.coverImage} ratio={16 / 9} priority sizes="(min-width:1440px) 1360px, 100vw" widths={[640, 1080, 1600, 2000]} className="detail-cover" />
        </button>

        <div className="detail-body">
          <div className="stack-lg">
            <section aria-labelledby="brief-h" className="stack">
              <h2 id="brief-h">The brief</h2>
              <div className="prose">{paragraphs(p.brief).map((t, i) => <p key={i}>{t}</p>)}</div>
            </section>
            <section aria-labelledby="approach-h" className="stack">
              <h2 id="approach-h">Our approach</h2>
              <div className="prose">{paragraphs(p.approach).map((t, i) => <p key={i}>{t}</p>)}</div>
            </section>
          </div>
          <aside className="detail-aside" aria-label="Project scope and enquiry">
            {p.scope.length > 0 && (
              <div className="stack">
                <h2>Scope of work</h2>
                <ul>{p.scope.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
            )}
            <div className="stack">
              <h2>Planning something similar?</h2>
              <Link className="btn" to={`/contact?project=${p.slug}&type=${encodeURIComponent(typeFor(p.category))}`}>Discuss a similar project</Link>
            </div>
            {p.demo && <p className="demo-note">Illustrative demo case study. The project is fictional and the photography is licensed stock.</p>}
          </aside>
        </div>

        {p.gallery.length > 0 && (
          <section aria-labelledby="gallery-h" style={{ paddingBottom: 'var(--section)' }}>
            <h2 id="gallery-h" style={{ marginBottom: 'var(--s-6)' }}>Gallery</h2>
            <ul className="gallery-grid" role="list">
              {p.gallery.map((g, i) => (
                <li key={g.url}>
                  <button type="button" onClick={() => setLb(i + 1)} aria-label={`Enlarge image ${i + 2} of ${images.length}: ${g.alt}`}>
                    <Frame image={g} ratio={4 / 3} sizes="(min-width:768px) 33vw, 50vw" widths={[480, 768, 1080]} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {data.related.length > 0 && (
        <section className="section section-alt" aria-labelledby="related-h">
          <div className="container">
            <h2 id="related-h" style={{ marginBottom: 'var(--s-7)' }}>Related projects</h2>
            <div className="project-grid">{data.related.map((r) => <ProjectCard key={r.id} project={r} />)}</div>
          </div>
        </section>
      )}
      {lb !== null && <Lightbox images={images} startIndex={lb} onClose={close} />}
    </article>
  );
}
