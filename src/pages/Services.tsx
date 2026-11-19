import { Link, useParams } from 'react-router-dom';
import { Frame } from '../components/Img';
import { ErrorState, PageSkeleton } from '../components/States';
import { useApi } from '../lib/api';
import { projectTypeForService } from '../lib/format';
import { useSeo } from '../lib/seo';
import { useSite } from '../lib/site';
import type { Service } from '../lib/types';
import NotFound from './NotFound';

export function Services() {
  useSeo({ title: 'Services', description: 'Architecture, interior design and renovation services from Atelier North, with clear deliverables and a four-step process.', path: '/services' });
  const { data, error, reload } = useApi<{ data: Service[] }>('/api/services');
  const { settings } = useSite();
  const steps = settings?.home.processSteps ?? [];
  return (
    <>
      <div className="container">
        <header className="page-head">
          <h1>Services</h1>
          <p className="lead">Three ways of working with us. Every project starts with a free conversation and a written brief.</p>
        </header>
        {error && <ErrorState error={error} onRetry={reload} />}
        <div className="service-rows" style={{ marginBottom: 'var(--section)' }}>
          {data?.data.map((s) => (
            <Link key={s.id} to={`/services/${s.slug}`} className="service-row">
              <h2 style={{ fontSize: 'var(--h2)' }}>{s.title}</h2>
              <p>{s.summary}</p>
              <span className="link-arrow">See deliverables<span className="sr-only"> for {s.title}</span></span>
            </Link>
          ))}
        </div>
      </div>
      {steps.length > 0 && (
        <section className="section section-alt" aria-labelledby="proc-h">
          <div className="container">
            <h2 id="proc-h" style={{ marginBottom: 'var(--s-7)' }}>{settings?.home.processTitle ?? 'How we work with you'}</h2>
            <ol className="steps steps--4">
              {steps.map((s) => <li key={s.title}><h3>{s.title}</h3><p>{s.description}</p></li>)}
            </ol>
          </div>
        </section>
      )}
    </>
  );
}

export function ServiceDetail() {
  const { slug } = useParams();
  const { data, error, loading, reload } = useApi<{ data: Service }>(`/api/services/${slug}`);
  const s = data?.data;
  useSeo({
    title: s?.title,
    description: s?.summary,
    image: s?.heroImage?.url,
    path: `/services/${slug}`,
    noindex: !s && !loading,
    jsonLd: s?.faq.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: s.faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
        }
      : undefined,
  });
  if (loading) return <PageSkeleton />;
  if (error?.status === 404) return <NotFound what="service" />;
  if (error || !s) return <div className="container"><ErrorState error={error} onRetry={reload} /></div>;
  const type = projectTypeForService(s.slug);

  return (
    <article>
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb" style={{ paddingTop: 'var(--s-5)' }}>
          <ol><li><Link to="/">Home</Link></li><li><Link to="/services">Services</Link></li><li aria-current="page">{s.title}</li></ol>
        </nav>
        <header className="page-head">
          <h1>{s.title}</h1>
          <p className="lead">{s.summary}</p>
        </header>
        {s.heroImage && <Frame image={s.heroImage} ratio={21 / 9} priority sizes="(min-width:1440px) 1360px, 100vw" widths={[640, 1080, 1600, 2000]} />}
        <div className="detail-body">
          <div className="prose" dangerouslySetInnerHTML={{ __html: s.description }} />
          {s.deliverables.length > 0 && (
            <aside className="detail-aside" aria-labelledby="del-h">
              <h2 id="del-h">What you receive</h2>
              <ul>{s.deliverables.map((d) => <li key={d}>{d}</li>)}</ul>
            </aside>
          )}
        </div>
      </div>

      {s.steps.length > 0 && (
        <section className="section section-alt" aria-labelledby="steps-h">
          <div className="container">
            <h2 id="steps-h" style={{ marginBottom: 'var(--s-7)' }}>How we work together</h2>
            <ol className="steps steps--4">{s.steps.map((st) => <li key={st.title}><h3>{st.title}</h3><p>{st.description}</p></li>)}</ol>
          </div>
        </section>
      )}

      {s.faq.length > 0 && (
        <section className="section" aria-labelledby="faq-h">
          <div className="container" style={{ maxWidth: 900 }}>
            <h2 id="faq-h" style={{ marginBottom: 'var(--s-6)' }}>Questions we are often asked</h2>
            <div className="accordion">
              {s.faq.map((f) => (
                <details key={f.question}>
                  <summary>{f.question}</summary>
                  <div className="answer"><p>{f.answer}</p></div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section-dark" aria-labelledby="svc-cta">
        <div className="container cta-band">
          <h2 id="svc-cta">Start a {s.title.toLowerCase()} enquiry</h2>
          <div className="cta-side stack">
            <p>Tell us about your site and what you hope to achieve. We reply within two working days.</p>
            <Link to={`/contact?service=${s.slug}${type ? `&type=${encodeURIComponent(type)}` : ''}`} className="btn btn-light">Book a consultation</Link>
          </div>
        </div>
      </section>
    </article>
  );
}
