import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, api, useApi } from '../lib/api';
import type { SiteSettings } from '../lib/types';
import { ErrorState, PageSkeleton } from '../components/States';
import { FormFields, setIn, type FieldSpec } from './fields';
import { ErrorSummary, errorMap, useUi } from './ui';

const FIELDS: FieldSpec[] = [
  { type: 'section', title: 'Studio' },
  { type: 'text', name: 'brand.name', label: 'Studio name', half: true },
  { type: 'text', name: 'brand.tagline', label: 'Tagline', half: true },
  { type: 'textarea', name: 'brand.description', label: 'Short description', rows: 3 },
  { type: 'section', title: 'Contact details' },
  { type: 'email', name: 'contact.email', label: 'Public email', half: true },
  { type: 'text', name: 'contact.phone', label: 'Phone', half: true },
  { type: 'text', name: 'contact.address', label: 'Address' },
  { type: 'text', name: 'contact.city', label: 'City', half: true },
  { type: 'url', name: 'contact.mapUrl', label: 'Map link', half: true, hint: 'A Google Maps or OpenStreetMap link.' },
  { type: 'text', name: 'contact.hours', label: 'Opening hours' },
  { type: 'email', name: 'notificationEmail', label: 'Enquiry notification email', hint: 'New enquiries are emailed here. Leave empty to use the server default.' },
  { type: 'section', title: 'Social' },
  { type: 'url', name: 'social.instagram', label: 'Instagram URL', half: true },
  { type: 'url', name: 'social.linkedin', label: 'LinkedIn URL', half: true },
  { type: 'url', name: 'social.pinterest', label: 'Pinterest URL' },
  { type: 'section', title: 'Search and sharing defaults' },
  { type: 'text', name: 'seoDefaults.title', label: 'Default page title' },
  { type: 'textarea', name: 'seoDefaults.description', label: 'Default description', rows: 3 },
  { type: 'url', name: 'seoDefaults.ogImage', label: 'Default share image URL' },
  { type: 'section', title: 'Home page' },
  { type: 'text', name: 'home.heroTitle', label: 'Hero headline' },
  { type: 'textarea', name: 'home.heroSubtitle', label: 'Hero subtitle', rows: 3 },
  { type: 'image', name: 'home.heroImage', label: 'Hero image', optional: true },
  { type: 'textarea', name: 'home.positioning', label: 'Positioning statement', rows: 4 },
  { type: 'objects', name: 'home.stats', label: 'Key figures', itemLabel: 'Figure', blank: { value: '', label: '' }, fields: [{ type: 'text', name: 'value', label: 'Value', half: true }, { type: 'text', name: 'label', label: 'Label', half: true }] },
  { type: 'text', name: 'home.processTitle', label: 'Process heading' },
  { type: 'objects', name: 'home.processSteps', label: 'Process steps', itemLabel: 'Step', blank: { title: '', description: '' }, fields: [{ type: 'text', name: 'title', label: 'Title' }, { type: 'textarea', name: 'description', label: 'Description', rows: 3 }] },
  { type: 'text', name: 'home.ctaTitle', label: 'Consultation banner heading' },
  { type: 'textarea', name: 'home.ctaText', label: 'Consultation banner text', rows: 3 },
  { type: 'section', title: 'About page' },
  { type: 'text', name: 'about.title', label: 'Heading' },
  { type: 'textarea', name: 'about.story', label: 'Story', rows: 8, hint: 'Separate paragraphs with a blank line.' },
  { type: 'objects', name: 'about.values', label: 'Values', itemLabel: 'Value', blank: { title: '', description: '' }, fields: [{ type: 'text', name: 'title', label: 'Title' }, { type: 'textarea', name: 'description', label: 'Description', rows: 3 }] },
  { type: 'strings', name: 'about.credentials', label: 'Credentials and recognition' },
  { type: 'image', name: 'about.image', label: 'Main image', optional: true },
  { type: 'images', name: 'about.gallery', label: 'Extra images' },
];

export function SettingsPage() {
  const { toast } = useUi();
  const { data, error, loading, reload } = useApi<{ data: SiteSettings }>('/api/admin/settings');
  const [form, setForm] = useState<any>(null);
  const [initial, setInitial] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    const d = JSON.parse(JSON.stringify(data.data));
    d.notificationEmail ??= '';
    setForm(d);
    setInitial(JSON.stringify(d));
  }, [data]);
  const dirty = form && JSON.stringify(form) !== initial;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setSummary(null);
    try {
      const { brand, contact, social, seoDefaults, notificationEmail, home, about } = form;
      const r = await api.put<{ data: SiteSettings }>('/api/admin/settings', { brand, contact, social, seoDefaults, notificationEmail: notificationEmail ?? '', home, about });
      const d = JSON.parse(JSON.stringify(r.data));
      d.notificationEmail ??= '';
      setForm(d);
      setInitial(JSON.stringify(d));
      toast('Settings saved. The public site updates within a minute.');
    } catch (err) {
      setErrors(errorMap(err));
      setSummary(err as ApiError);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('.alert-error')?.focus());
    } finally {
      setSaving(false);
    }
  };

  if (loading && !form) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!form) return null;
  return (
    <div>
      <div className="admin-head"><div><h1>Site settings</h1><p className="muted">Studio details, home and about page content, and search defaults.</p></div></div>
      <form onSubmit={save} noValidate aria-label="Site settings">
        <ErrorSummary error={summary} items={summary?.details} />
        <div className="form-grid form-grid--2">
          <FormFields fields={FIELDS} value={form} onChange={(p, v) => setForm((f: any) => setIn(f, p, v))} errors={errors} />
        </div>
        <div className="row sticky-actions">
          <button className="btn" type="submit" disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save settings'}</button>
          {dirty && <span className="small muted" role="status">Unsaved changes</span>}
        </div>
      </form>
    </div>
  );
}
