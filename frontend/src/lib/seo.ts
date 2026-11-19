import { useEffect } from 'react';
import { sizedUrl } from './images';
import { useSite } from './site';

const ENV_SITE = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '');
export const siteOrigin = () => ENV_SITE || (typeof window !== 'undefined' ? window.location.origin : '');

function setMeta(attr: 'name' | 'property', key: string, content?: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

/** Per-page <title>, description, canonical URL, Open Graph / Twitter tags and optional JSON-LD. */
export function useSeo({ title, description, image, path, type = 'website', noindex = false, jsonLd }: SeoProps) {
  const { settings } = useSite();
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const brand = settings?.brand.name ?? 'Atelier North';
    const fullTitle = title ? `${title} – ${brand}` : settings?.seoDefaults.title ?? brand;
    const desc = description || settings?.seoDefaults.description || '';
    const canonical = `${siteOrigin()}${path ?? window.location.pathname}`;
    const rawImg = image || settings?.seoDefaults.ogImage;
    const ogImage = rawImg ? sizedUrl(rawImg, 1200, 630) : undefined;

    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:site_name', brand);
    setMeta('property', 'og:image', ogImage);
    setMeta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', ogImage);

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;

    let script = document.head.querySelector<HTMLScriptElement>('script#jsonld');
    if (ld) {
      if (!script) {
        script = document.createElement('script');
        script.id = 'jsonld';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = ld;
    } else script?.remove();
  }, [title, description, image, path, type, noindex, ld, settings]);
}
