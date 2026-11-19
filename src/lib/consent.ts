/** Cookie / analytics choice. Analytics (Plausible) only loads after the visitor accepts. */
const KEY = 'an_consent';
export type Consent = 'granted' | 'denied' | null;

const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
export const analyticsEnabled = Boolean(domain);

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Exclude<Consent, null>) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* storage unavailable – choice lasts for this page view only */
  }
  if (value === 'granted') loadAnalytics();
  else document.querySelector('script[data-an-analytics]')?.remove();
}

export function loadAnalytics() {
  if (!analyticsEnabled || document.querySelector('script[data-an-analytics]')) return;
  const s = document.createElement('script');
  s.defer = true;
  s.src = 'https://plausible.io/js/script.js';
  s.dataset.domain = domain;
  s.dataset.anAnalytics = '1';
  document.head.appendChild(s);
}

export const OPEN_EVENT = 'an:open-cookie-settings';
export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_EVENT));
