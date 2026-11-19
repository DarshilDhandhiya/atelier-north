import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArticleCard, ProjectCard } from '../components/Cards';
import { CountUp, ExpandImage, HScroll, Marquee, Reveal, SplitText } from '../components/fx';
import { Frame } from '../components/Img';
import { Scene3D } from '../components/Scene3D';
import { useScrollProgress } from '../lib/fx';
import { CardSkeletons, ErrorState } from '../components/States';
import { useApi } from '../lib/api';
import { useSeo, siteOrigin } from '../lib/seo';
import { useSite } from '../lib/site';
import type { Article, Paged, Project, Service, Testimonial } from '../lib/types';

const DEFAULTS = {
  heroTitle: 'Rooms and buildings shaped by light, weather and the people who use them.',
  heroSubtitle: 'Atelier North is a small studio of architects and interior designers. We design homes, workplaces and hotels that feel calm on the first day and better every year after.',
};


const BUILD_STEPS = [
  { title: 'The site', text: 'Every project starts with a patch of ground: its slope, orientation, wind and views. We survey before we sketch.' },
  { title: 'The structure', text: 'Two floors, a concrete core and solid end walls carry the house. A cantilevered upper volume frames the valley view.' },
  { title: 'The envelope', text: 'Floor-to-ceiling glazing is shaded by fixed timber louvres, tuned to the sun path so the rooms stay cool in summer.' },
  { title: 'The roof', text: 'A deep overhang and a planted roof reduce heat gain, hold rainwater and give the site back its green.' },
];

/** Scroll-driven exploded 3D house. The canvas only renders while pinned on screen. */
function ExplodedHouse() {
  const track = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  useScrollProgress(track, (p, el) => el.style.setProperty('--p', p.toFixed(4)));
  return (
    <section className="explode" ref={track} aria-labelledby="explode-h">
      <div className="explode-pin">
        <div className="container explode-grid">
          <div className="explode-copy">
            <p className="eyebrow">Scroll to take it apart</p>
            <h2 id="explode-h">How a house is built, layer by layer.</h2>
            <ol className="explode-steps">
              {BUILD_STEPS.map((s, i) => (
                <li key={s.title} aria-current={i === step ? 'step' : undefined}>
                  <span className="explode-num" aria-hidden="true">0{i + 1}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="explode-rail" aria-hidden="true"><i /></div>
          </div>
          <div className="explode-scene">
            <Scene3D mode="explode" trackRef={track} onStep={setStep} lazyLoadMargin="900px" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const { data } = useApi<{ data: Testimonial[] }>('/api/testimonials');
  const [i, setI] = useState(0);
  const items = data?.data ?? [];
  if (!items.length) return null;
  const t = items[i % items.length];
  const project = typeof t.projectId === 'object' && t.projectId ? t.projectId : null;
  return (
    <section className="section" aria-labelledby="testimonial-h">
      <div className="container">
        <h2 id="testimonial-h" className="sr-only">What clients say</h2>
        <figure className="testimonial" aria-live="polite">
          <blockquote>“{t.quote}”</blockquote>
          <figcaption>
            <strong>{t.name}</strong>
            {t.role}
            {project && (
              <>
                {' · '}
                <Link to={`/projects/${project.slug}`}>View {project.title}</Link>
              </>
            )}
          </figcaption>
        </figure>
        {items.length > 1 && (
          <div className="testimonial-controls" style={{ marginTop: 'var(--s-6)' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setI((i - 1 + items.length) % items.length)}>
              Previous quote
            </button>
            <span className="small muted" aria-hidden="true">{(i % items.length) + 1} of {items.length}</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setI((i + 1) % items.length)}>
              Next quote
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const { settings } = useSite();
  const h = settings?.home;
  const brand = settings?.brand.name ?? 'Atelier North';
  useSeo({
    path: '/',
    image: h?.heroImage?.url,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      name: brand,
      description: settings?.brand.description,
      url: siteOrigin(),
      email: settings?.contact.email,
      telephone: settings?.contact.phone,
      address: settings?.contact.address,
      areaServed: 'Europe and North America',
    },
  });

  const featured = useApi<Paged<Project>>('/api/projects?featured=true&limit=4');
  const services = useApi<{ data: Service[] }>('/api/services');
  const articles = useApi<Paged<Article>>('/api/articles?limit=3');
  const hero = h?.heroImage;

  const serviceNames = services.data?.data.map((x) => x.title) ?? ['Architecture', 'Interior design', 'Renovation'];

  return (
    <>
      <section className="hero-x" aria-labelledby="hero-h">
        <div className="container hero-x-grid">
          <div className="hero-x-copy">
            <p className="eyebrow">{settings?.contact.city ? `Architecture and interiors, ${settings.contact.city}` : 'Architecture and interiors'}</p>
            <SplitText as="h1" id="hero-h" text={h?.heroTitle ?? DEFAULTS.heroTitle} />
            <p className="lead">{h?.heroSubtitle ?? DEFAULTS.heroSubtitle}</p>
            <div className="hero-actions">
              <Link to="/contact" className="btn btn-light" data-magnetic>Book a consultation</Link>
              <Link to="/projects" className="btn btn-ghost-light" data-magnetic>View our projects</Link>
            </div>
          </div>
          <div className="hero-x-scene">
            <Scene3D mode="hero" lazyLoadMargin="0px" />
          </div>
        </div>
        <p className="hero-cue" aria-hidden="true"><span /> Scroll</p>
      </section>

      <Marquee items={serviceNames} label="Our services" />

      {hero ? (
        <ExpandImage
          overlay={
            <div className="container">
              <h2 id="pos-h" className="expand-title">A small studio, with a partner on every project.</h2>
            </div>
          }
        >
          <Frame image={hero} ratio={16 / 9} sizes="100vw" widths={[768, 1280, 1920]} />
        </ExpandImage>
      ) : (
        <section className="section section-dark" aria-labelledby="pos-h">
          <div className="container"><h2 id="pos-h">A small studio, with a partner on every project.</h2></div>
        </section>
      )}

      <section className="section section-night" aria-label="Studio at a glance">
        <div className="container positioning">
          <Reveal>
            <p className="lead lead--xl">{h?.positioning ?? 'We take on a few projects at a time so the people you meet in the first conversation are the people who draw, specify and visit site.'}</p>
          </Reveal>
          {!!h?.stats?.length && (
            <dl className="stats">
              {h.stats.map((s, i) => (
                <Reveal key={s.label} delay={i * 120} className="stat">
                  <dt><CountUp value={s.value} /></dt>
                  <dd>{s.label}</dd>
                </Reveal>
              ))}
            </dl>
          )}
        </div>
      </section>

      <ExplodedHouse />

      <section className="section section-tight" aria-labelledby="selected-h">
        <div className="container">
          <div className="section-head section-head--split">
            <SplitText as="h2" id="selected-h" text="Selected projects" />
            <Link to="/projects" className="link-arrow">Browse all projects</Link>
          </div>
          {featured.loading && <CardSkeletons count={4} />}
          {featured.error && <ErrorState error={featured.error} onRetry={featured.reload} title="We could not load the projects" />}
        </div>
        {featured.data && (
          <HScroll label="Selected projects">
            {featured.data.data.map((p) => (
              <div role="listitem" className="hscroll-item" key={p.id}>
                <ProjectCard project={p} ratio={4 / 5} priority={false} sizes="(min-width:1024px) 34vw, 80vw" />
              </div>
            ))}
            <div role="listitem" className="hscroll-item hscroll-end">
              <Link to="/projects" className="hscroll-all" data-magnetic>
                <span>See every project</span>
              </Link>
            </div>
          </HScroll>
        )}
      </section>

      <section className="section section-alt" aria-labelledby="services-h">
        <div className="container">
          <div className="section-head section-head--split">
            <SplitText as="h2" id="services-h" text="What we do" />
            <Link to="/services" className="link-arrow">All services</Link>
          </div>
          {services.error && <ErrorState error={services.error} onRetry={services.reload} />}
          <div className="service-rows">
            {services.data?.data.map((s, i) => (
              <Reveal key={s.id} delay={i * 90}>
                <Link to={`/services/${s.slug}`} className="service-row">
                  <h3>{s.title}</h3>
                  <p>{s.summary}</p>
                  <span className="link-arrow">Read more<span className="sr-only"> about {s.title}</span></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {!!h?.processSteps?.length && (
        <section className="section" aria-labelledby="process-h">
          <div className="container">
            <div className="section-head">
              <SplitText as="h2" id="process-h" text={h.processTitle ?? 'How we work with you'} />
            </div>
            <ol className="steps steps--4 steps--fx">
              {h.processSteps.map((s, i) => (
                <Reveal as="li" key={s.title} delay={i * 130}>
                  <span className="step-no" aria-hidden="true">{i + 1}</span>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      )}

      <Testimonials />

      <section className="section section-dark cta-x" aria-labelledby="cta-h">
        <div className="container cta-band">
          <SplitText as="h2" id="cta-h" text={h?.ctaTitle ?? 'Planning a home, a workplace or a hotel?'} />
          <div className="cta-side stack">
            <p>{h?.ctaText ?? 'Tell us about your project. We reply to every enquiry within two working days.'}</p>
            <Link to="/contact" className="btn btn-light" data-magnetic>Book a consultation</Link>
          </div>
        </div>
      </section>

      {!!articles.data?.data.length && (
        <section className="section" aria-labelledby="journal-h">
          <div className="container">
            <div className="section-head section-head--split">
              <SplitText as="h2" id="journal-h" text="From the journal" />
              <Link to="/journal" className="link-arrow">Read the journal</Link>
            </div>
            <div className="article-grid">
              {articles.data.data.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
