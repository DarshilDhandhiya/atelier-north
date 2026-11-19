import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { analyticsEnabled, getConsent, loadAnalytics, OPEN_EVENT, openCookieSettings, setConsent } from '../lib/consent';
import { useSite } from '../lib/site';

const NAV = [
  { to: '/projects', label: 'Projects' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/journal', label: 'Journal' },
  { to: '/contact', label: 'Contact' },
];

function Header() {
  const { settings } = useSite();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const brand = settings?.brand.name ?? 'Atelier North';
  return (
    <header className="site-header" data-home={pathname === '/' ? 'true' : 'false'} data-open={open ? 'true' : undefined}>
      <div className="container">
        <Link to="/" className="brand" aria-label={`${brand} – home`}>
          {brand}
        </Link>
        <nav className="nav" aria-label="Main">
          {NAV.slice(0, 4).map((n) => (
            <NavLink key={n.to} to={n.to}>
              {n.label}
            </NavLink>
          ))}
          <NavLink to="/contact" className="btn">
            Book a consultation
          </NavLink>
        </nav>
        <button ref={toggleRef} type="button" className="menu-toggle" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
          {open ? 'Close' : 'Menu'}
          <span className="sr-only"> navigation</span>
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to}>
              {n.label}
            </NavLink>
          ))}
          <Link to="/contact" className="btn">
            Book a consultation
          </Link>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { settings } = useSite();
  const c = settings?.contact;
  const social = settings?.social;
  return (
    <footer className="site-footer">
      <div className="container">
        <p className="footer-mark" aria-hidden="true">{settings?.brand.name ?? 'Atelier North'}</p>
        <div className="footer-grid">
          <div>
            <p className="footer-brand">{settings?.brand.name ?? 'Atelier North'}</p>
            <p style={{ marginTop: 'var(--s-3)', maxWidth: '34ch' }}>{settings?.brand.tagline}</p>
          </div>
          <div>
            <h2>Studio</h2>
            <ul>
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to}>{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Contact</h2>
            <ul>
              {c?.email && (
                <li>
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </li>
              )}
              {c?.phone && (
                <li>
                  <a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a>
                </li>
              )}
              {c?.city && <li>{c.city}</li>}
            </ul>
          </div>
          <div>
            <h2>Follow</h2>
            <ul>
              {social?.instagram && (
                <li>
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer">
                    Instagram<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              )}
              {social?.linkedin && (
                <li>
                  <a href={social.linkedin} target="_blank" rel="noopener noreferrer">
                    LinkedIn<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              )}
              {social?.pinterest && (
                <li>
                  <a href={social.pinterest} target="_blank" rel="noopener noreferrer">
                    Pinterest<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="footer-base">
          <p>
            © {new Date().getFullYear()} {settings?.brand.name ?? 'Atelier North'}. Demo website: the studio, projects and people are fictional. Photography via{' '}
            <a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer">Pexels</a>.
          </p>
          <p className="row" style={{ gap: 'var(--s-5)' }}>
            <Link to="/privacy">Privacy notice</Link>
            {analyticsEnabled && (
              <button type="button" className="link-button" onClick={openCookieSettings}>
                Cookie settings
              </button>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}

function StickyCta() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (pathname.startsWith('/contact') || pathname.startsWith('/design-system')) return null;
  return (
    <div className="sticky-cta" data-visible={visible} aria-hidden={!visible}>
      <p>Planning a project?</p>
      <Link to="/contact" className="btn btn-sm" tabIndex={visible ? 0 : -1}>
        Start an enquiry
      </Link>
    </div>
  );
}

function CookieBanner() {
  const [consent, setLocal] = useState(getConsent());
  const [forceOpen, setForceOpen] = useState(false);
  useEffect(() => {
    if (consent === 'granted') loadAnalytics();
  }, [consent]);
  useEffect(() => {
    const open = () => setForceOpen(true);
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);
  if (!analyticsEnabled || (consent !== null && !forceOpen)) return null;
  const choose = (v: 'granted' | 'denied') => {
    setConsent(v);
    setLocal(v);
    setForceOpen(false);
  };
  return (
    <section className="cookie-banner" role="region" aria-label="Cookie choices">
      <h2>Can we measure visits?</h2>
      <p>
        With your permission we use privacy-friendly analytics to see which pages are useful. Nothing loads unless you accept. Read the <Link to="/privacy">privacy notice</Link>.
      </p>
      <div className="row">
        <button type="button" className="btn btn-light btn-sm" onClick={() => choose('granted')}>
          Accept analytics
        </button>
        <button type="button" className="btn btn-ghost-light btn-sm" onClick={() => choose('denied')}>
          Decline
        </button>
      </div>
    </section>
  );
}

/** Moves focus to <main> and scrolls to top on navigation, so keyboard and screen-reader users start at the new page. */
function RouteAnnouncer() {
  const { pathname, hash } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname, hash]);
  return null;
}

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <main id="main" tabIndex={-1} key={pathname} className="page-enter">
        <Outlet />
      </main>
      <Footer />
      <StickyCta />
      <CookieBanner />
      <RouteAnnouncer />
    </>
  );
}
