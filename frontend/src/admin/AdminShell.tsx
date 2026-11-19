import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ApiError, useApi } from '../lib/api';
import { useSeo } from '../lib/seo';
import { ErrorState, PageSkeleton } from '../components/States';
import { useAuth } from './auth';
import { Badge } from './ui';

/* ============================ login ============================ */
export function LoginPage() {
  useSeo({ title: 'Sign in', noindex: true, path: '/admin/login' });
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? '/admin';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);
  const errRef = useRef<HTMLDivElement>(null);

  if (user) return <Navigate to={from} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const f: typeof fields = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) f.email = 'Enter your email address.';
    if (!password) f.password = 'Enter your password.';
    setFields(f);
    setError(null);
    if (Object.keys(f).length) return requestAnimationFrame(() => errRef.current?.focus());
    setBusy(true);
    try {
      await login(email.trim(), password);
      nav(from, { replace: true });
    } catch (err) {
      const a = err as ApiError;
      setError(a.status === 429 ? 'Too many sign-in attempts. Wait a few minutes and try again.' : a.status === 401 ? 'That email and password do not match. Check them and try again.' : a.message);
      requestAnimationFrame(() => errRef.current?.focus());
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main" className="login">
      <div className="login-card">
        <Link to="/" className="link-arrow small">Back to the website</Link>
        <h1>Studio sign in</h1>
        <p className="muted">For Atelier North staff. Editors and admins sign in here.</p>
        <form onSubmit={submit} noValidate aria-label="Sign in">
          <div ref={errRef} tabIndex={-1} role="alert" style={{ outline: 'none' }}>
            {(error || fields.email || fields.password) && (
              <div className="alert alert-error">
                <h2>We could not sign you in</h2>
                <p>{error ?? [fields.email, fields.password].filter(Boolean).join(' ')}</p>
              </div>
            )}
          </div>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input id="login-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={fields.email ? true : undefined} />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input id="login-password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={fields.password ? true : undefined} />
          </div>
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </main>
  );
}

/* ============================ layout ============================ */
export function AdminLayout() {
  useSeo({ title: 'Studio admin', noindex: true, path: '/admin' });
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [loc.pathname]);
  const isAdmin = user?.role === 'admin';

  const links: [string, string, boolean][] = [
    ['/admin', 'Dashboard', true],
    ['/admin/projects', 'Projects', false],
    ['/admin/services', 'Services', false],
    ['/admin/articles', 'Journal', false],
    ['/admin/testimonials', 'Testimonials', false],
    ['/admin/team', 'Team', false],
    ['/admin/media', 'Media', false],
    ...(isAdmin ? ([['/admin/enquiries', 'Enquiries', false], ['/admin/users', 'Users', false], ['/admin/settings', 'Settings', false]] as [string, string, boolean][]) : []),
  ];

  return (
    <div className="admin">
      <a href="#admin-main" className="skip-link">Skip to content</a>
      <header className="admin-bar">
        <Link to="/admin" className="admin-brand">Atelier North <span className="muted">Studio admin</span></Link>
        <button type="button" className="btn btn-outline btn-sm admin-menu-btn" aria-expanded={open} aria-controls="admin-nav" onClick={() => setOpen(!open)}>Menu</button>
        <div className="row admin-user">
          <span className="small">{user?.name} <Badge kind={isAdmin ? 'qualified' : 'contacted'}>{user?.role}</Badge></span>
          <Link className="btn btn-outline btn-sm" to="/" target="_blank">View site<span className="sr-only"> (opens in a new tab)</span></Link>
          <button type="button" className="btn btn-outline btn-sm" onClick={async () => { await logout(); nav('/admin/login'); }}>Sign out</button>
        </div>
      </header>
      <div className="admin-body">
        <nav id="admin-nav" className={`admin-nav ${open ? 'is-open' : ''}`} aria-label="Admin">
          <ul role="list">
            {links.map(([to, label, end]) => <li key={to}><NavLink to={to} end={end}>{label}</NavLink></li>)}
          </ul>
        </nav>
        <main id="admin-main" tabIndex={-1} className="admin-main"><Outlet /></main>
      </div>
    </div>
  );
}

/* ============================ dashboard ============================ */
interface Stats {
  projects: { published: number; draft: number };
  articles: { published: number; draft: number };
  services: number;
  testimonials: number;
  enquiries?: { new: number; failedEmails: number; total: number; recent: { id: string; reference: string; name: string; projectType: string; status: string; createdAt: string }[] };
}

export function Dashboard() {
  useSeo({ title: 'Dashboard', noindex: true, path: '/admin' });
  const { user } = useAuth();
  const { data, error, loading, reload } = useApi<{ data: Stats }>('/api/admin/stats');
  if (loading && !data) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const s = data!.data;
  const tile = (label: string, value: number | string, to: string, note?: string) => (
    <Link to={to} className="tile"><span className="tile-value">{value}</span><span className="tile-label">{label}</span>{note && <span className="small muted">{note}</span>}</Link>
  );
  return (
    <div>
      <div className="admin-head"><div><h1>Welcome back, {user?.name.split(' ')[0]}</h1><p className="muted">{user?.role === 'admin' ? 'You can manage content, enquiries, users and settings.' : 'You can manage content and media. Enquiries, users and settings are admin-only.'}</p></div></div>

      {s.enquiries && (s.enquiries.new > 0 || s.enquiries.failedEmails > 0) && (
        <div className="alert alert-info" role="status">
          <h2>Needs your attention</h2>
          <ul>
            {s.enquiries.new > 0 && <li><Link to="/admin/enquiries?status=new">{s.enquiries.new} new enquir{s.enquiries.new === 1 ? 'y' : 'ies'}</Link> waiting for a reply.</li>}
            {s.enquiries.failedEmails > 0 && <li><Link to="/admin/enquiries?emailStatus=failed">{s.enquiries.failedEmails} notification email{s.enquiries.failedEmails === 1 ? '' : 's'}</Link> failed to send.</li>}
          </ul>
        </div>
      )}

      <div className="tiles">
        {tile('Published projects', s.projects.published, '/admin/projects?status=published', `${s.projects.draft} draft`)}
        {tile('Journal articles', s.articles.published, '/admin/articles?status=published', `${s.articles.draft} draft`)}
        {tile('Services', s.services, '/admin/services')}
        {tile('Approved testimonials', s.testimonials, '/admin/testimonials')}
        {s.enquiries && tile('New enquiries', s.enquiries.new, '/admin/enquiries?status=new', `${s.enquiries.total} in total`)}
      </div>

      {s.enquiries && (
        <section aria-labelledby="recent" style={{ marginTop: 'var(--s-8)' }}>
          <h2 id="recent">Recent enquiries</h2>
          {s.enquiries.recent.length === 0 ? <p className="muted">No enquiries yet.</p> : (
            <div className="table-wrap"><table className="table"><caption className="sr-only">Five most recent enquiries</caption>
              <thead><tr><th scope="col">Reference</th><th scope="col">From</th><th scope="col">Type</th><th scope="col">Status</th></tr></thead>
              <tbody>{s.enquiries.recent.map((e) => <tr key={e.id}><td><Link to={`/admin/enquiries/${e.id}`}>{e.reference}</Link></td><td>{e.name}</td><td>{e.projectType}</td><td><Badge kind={e.status} /></td></tr>)}</tbody>
            </table></div>
          )}
        </section>
      )}
    </div>
  );
}
