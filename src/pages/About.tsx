import { Link } from 'react-router-dom';
import { Frame } from '../components/Img';
import { ErrorState } from '../components/States';
import { useApi } from '../lib/api';
import { initials, paragraphs } from '../lib/format';
import { useSeo } from '../lib/seo';
import { useSite } from '../lib/site';
import type { TeamMember } from '../lib/types';

export default function About() {
  const { settings } = useSite();
  const a = settings?.about;
  useSeo({ title: 'About', description: 'Meet the architects and designers of Atelier North, and the values behind how we work.', path: '/about', image: a?.image?.url });
  const team = useApi<{ data: TeamMember[] }>('/api/team');

  return (
    <>
      <div className="container">
        <header className="page-head">
          <h1>{a?.title ?? 'A small studio with a long view'}</h1>
        </header>
        <div className="about-intro" style={{ paddingBottom: 'var(--section)' }}>
          <div className="prose" style={{ fontSize: 'var(--text-lg)' }}>
            {paragraphs(a?.story).map((t, i) => <p key={i}>{t}</p>)}
          </div>
          {a?.image && <Frame image={a.image} ratio={4 / 5} priority sizes="(min-width:1024px) 40vw, 100vw" widths={[480, 768, 1080]} />}
        </div>
      </div>

      {!!a?.values?.length && (
        <section className="section section-alt" aria-labelledby="values-h">
          <div className="container">
            <h2 id="values-h" style={{ marginBottom: 'var(--s-7)' }}>What we believe</h2>
            <div className="values">
              {a.values.map((v) => <div key={v.title}><h3>{v.title}</h3><p>{v.description}</p></div>)}
            </div>
          </div>
        </section>
      )}

      <section className="section" aria-labelledby="team-h">
        <div className="container">
          <h2 id="team-h" style={{ marginBottom: 'var(--s-7)' }}>The people you will work with</h2>
          {team.error && <ErrorState error={team.error} onRetry={team.reload} />}
          <div className="team-grid">
            {team.data?.data.map((m) => (
              <article key={m.id} className="team-card">
                {m.photo ? <Frame image={m.photo} ratio={4 / 5} sizes="(min-width:768px) 33vw, 100vw" /> : <div className="monogram" aria-hidden="true">{initials(m.name)}</div>}
                <h3>{m.name}</h3>
                <p className="label">{m.role}</p>
                <p style={{ marginTop: 'var(--s-3)' }}>{m.bio}</p>
                {m.credentials.length > 0 && <ul className="credentials" aria-label={`${m.name} credentials`}>{m.credentials.map((c) => <li key={c}>{c}</li>)}</ul>}
              </article>
            ))}
          </div>
        </div>
      </section>

      {!!a?.credentials?.length && (
        <section className="section section-alt" aria-labelledby="cred-h">
          <div className="container about-intro">
            <h2 id="cred-h">Credentials and recognition</h2>
            <ul className="credential-list">{a.credentials.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        </section>
      )}

      {!!a?.gallery?.length && (
        <section className="section" aria-labelledby="studio-h">
          <div className="container">
            <h2 id="studio-h" style={{ marginBottom: 'var(--s-6)' }}>Inside the studio</h2>
            <div className="studio-strip">{a.gallery.map((g) => <Frame key={g.url} image={g} ratio={4 / 3} sizes="(min-width:768px) 33vw, 100vw" />)}</div>
          </div>
        </section>
      )}

      <section className="section section-dark">
        <div className="container cta-band">
          <h2>Let us talk about your project.</h2>
          <div className="cta-side stack">
            <p>A free 30-minute call is the best way to find out whether we are a good fit.</p>
            <Link to="/contact" className="btn btn-light">Book a consultation</Link>
          </div>
        </div>
      </section>
    </>
  );
}
