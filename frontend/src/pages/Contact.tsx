import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ApiError, api, useApi } from '../lib/api';
import { ALLOWED_EXT, FALLBACK_OPTIONS, MAX_ATTACHMENT_MB, validateEnquiry, type EnquiryErrors, type EnquiryValues } from '../lib/enquiryForm';
import { prettifySlug, projectTypeForService } from '../lib/format';
import { useSeo } from '../lib/seo';
import { useSite } from '../lib/site';
import type { EnquiryOptions } from '../lib/types';

const EMPTY: EnquiryValues = { name: '', email: '', phone: '', projectType: '', location: '', budgetRange: '', timeline: '', message: '', consent: false };
const FIELD_ORDER: (keyof EnquiryValues | 'attachment')[] = ['name', 'email', 'phone', 'projectType', 'location', 'budgetRange', 'timeline', 'message', 'attachment', 'consent'];
const LABELS: Record<string, string> = { name: 'Name', email: 'Email', phone: 'Phone', projectType: 'Project type', location: 'Project location', budgetRange: 'Budget range', timeline: 'Timeline', message: 'About your project', attachment: 'Attachment', consent: 'Privacy consent' };

export default function Contact() {
  useSeo({ title: 'Contact', description: 'Book a consultation with Atelier North. Tell us about your project and we will reply within two working days.', path: '/contact' });
  const { settings } = useSite();
  const c = settings?.contact;
  const [params] = useSearchParams();
  const opts = useApi<{ data: EnquiryOptions }>('/api/meta/enquiry-options').data?.data ?? FALLBACK_OPTIONS;

  const sourceProject = params.get('project') ?? '';
  const sourceService = params.get('service') ?? '';
  const initial = useMemo<EnquiryValues>(() => {
    const type = params.get('type') ?? projectTypeForService(sourceService) ?? '';
    return { ...EMPTY, projectType: type, message: sourceProject ? `I would like to discuss a project similar to ${prettifySlug(sourceProject)}.\n\n` : '' };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [values, setValues] = useState<EnquiryValues>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot
  const startedAt = useRef(Date.now());
  const summaryRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (reference) doneRef.current?.focus();
  }, [reference]);

  const set = <K extends keyof EnquiryValues>(key: K, value: EnquiryValues[K]) => {
    const next = { ...values, [key]: value };
    setValues(next);
    if (submitted) setErrors(validateEnquiry(next, file));
  };
  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (submitted) setErrors(validateEnquiry(values, f));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    const found = validateEnquiry(values, file);
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, String(v)));
    fd.append('website', website);
    fd.append('formStartedAt', String(startedAt.current));
    if (sourceProject) fd.append('sourceProject', sourceProject);
    if (sourceService) fd.append('sourceService', sourceService);
    if (file) fd.append('attachment', file);
    setSending(true);
    try {
      const res = await api.post<{ data: { reference: string } }>('/api/enquiries', fd);
      setReference(res.data.reference);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.details?.length) {
        const mapped: EnquiryErrors = {};
        apiErr.details.forEach((d) => {
          mapped[d.path as keyof EnquiryErrors] = d.message;
        });
        setErrors(mapped);
        requestAnimationFrame(() => summaryRef.current?.focus());
      } else {
        setServerError(apiErr.message || 'Your enquiry could not be sent.');
        requestAnimationFrame(() => summaryRef.current?.focus());
      }
    } finally {
      setSending(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable: the reference is visible on screen */
    }
  };

  const errorList = FIELD_ORDER.filter((k) => errors[k]);
  const field = (id: keyof EnquiryValues | 'attachment') => ({
    id: `f-${id}`,
    'aria-invalid': errors[id] ? (true as const) : undefined,
    'aria-describedby': errors[id] ? `e-${id}` : `h-${id}`,
  });
  const Err = ({ id }: { id: string }) => (errors[id as keyof EnquiryErrors] ? <p id={`e-${id}`} className="field-error">{errors[id as keyof EnquiryErrors]}</p> : null);

  return (
    <div className="container">
      <header className="page-head">
        <h1>Tell us about your project</h1>
        <p className="lead">The form takes about three minutes. We read every enquiry and reply within two working days.</p>
      </header>

      <div className="contact-grid" style={{ paddingBottom: 'var(--section)' }}>
        <aside className="contact-info" aria-label="Studio contact details">
          <dl>
            {c?.address && <div><dt>Studio</dt><dd><address>{c.address}</address></dd></div>}
            {c?.hours && <div><dt>Opening hours</dt><dd>{c.hours}</dd></div>}
            {c?.email && <div><dt>Email</dt><dd><a href={`mailto:${c.email}`}>{c.email}</a></dd></div>}
            {c?.phone && <div><dt>Phone</dt><dd><a href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a></dd></div>}
            {c?.mapUrl && (
              <div>
                <dt>Find us</dt>
                <dd><a href={c.mapUrl} target="_blank" rel="noopener noreferrer">Open the map<span className="sr-only"> (opens in a new tab)</span></a></dd>
              </div>
            )}
            <div>
              <dt>Elsewhere</dt>
              <dd className="row" style={{ gap: 'var(--s-4)' }}>
                {settings?.social.instagram && <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer">Instagram<span className="sr-only"> (opens in a new tab)</span></a>}
                {settings?.social.linkedin && <a href={settings.social.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn<span className="sr-only"> (opens in a new tab)</span></a>}
              </dd>
            </div>
          </dl>
        </aside>

        <div className="form-card">
          {reference ? (
            <div className="confirmation" role="status">
              <h2 ref={doneRef} tabIndex={-1} style={{ fontSize: 'var(--h2)' }}>Thank you. Your enquiry is with us.</h2>
              <p>Your reference number is below. Quote it if you contact us about this enquiry.</p>
              <div className="row">
                <span className="reference" aria-label={`Reference ${reference.split('').join(' ')}`}>{reference}</span>
                <button type="button" className="btn btn-outline btn-sm" onClick={copy}>{copied ? 'Copied' : 'Copy reference'}</button>
              </div>
              <div className="alert alert-info">
                <h3>What happens next</h3>
                <ul>
                  <li>A member of the studio reads your enquiry, usually the same day.</li>
                  <li>We reply within two working days to suggest a time for a 30-minute call.</li>
                  <li>After the call, we send a short written summary and a fee proposal.</li>
                </ul>
              </div>
              <div className="row"><Link to="/projects" className="btn">Browse projects while you wait</Link><Link to="/" className="btn btn-outline">Back to home</Link></div>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate aria-label="Project enquiry">
              <div ref={summaryRef} tabIndex={-1} role="alert" aria-live="assertive" style={{ outline: 'none' }}>
                {errorList.length > 0 && (
                  <div className="alert alert-error" style={{ marginBottom: 'var(--s-6)' }}>
                    <h2>Please fix {errorList.length === 1 ? '1 problem' : `${errorList.length} problems`} before sending</h2>
                    <ul>
                      {errorList.map((k) => (
                        <li key={k}>
                          <a href={`#f-${k}`} onClick={(e) => { e.preventDefault(); document.getElementById(`f-${k}`)?.focus(); }}>{LABELS[k]}</a>: {errors[k]}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {serverError && (
                  <div className="alert alert-error" style={{ marginBottom: 'var(--s-6)' }}>
                    <h2>We could not send your enquiry</h2>
                    <p>{serverError} Your answers are still here, so you can try again. If it keeps failing, email {c?.email ?? 'us'} directly.</p>
                  </div>
                )}
              </div>

              <div className="form-grid form-grid--2">
                <div className="field">
                  <label htmlFor="f-name">Your name</label>
                  <input className="input" type="text" autoComplete="name" required value={values.name} onChange={(e) => set('name', e.target.value)} {...field('name')} />
                  <Err id="name" />
                </div>
                <div className="field">
                  <label htmlFor="f-email">Email</label>
                  <input className="input" type="email" autoComplete="email" required value={values.email} onChange={(e) => set('email', e.target.value)} {...field('email')} />
                  <Err id="email" />
                </div>
                <div className="field">
                  <label htmlFor="f-phone">Phone <span className="optional">(optional)</span></label>
                  <input className="input" type="tel" autoComplete="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} {...field('phone')} />
                  <p id="h-phone" className="hint">Include the country code if you are abroad.</p>
                  <Err id="phone" />
                </div>
                <div className="field">
                  <label htmlFor="f-location">Project location</label>
                  <input className="input" type="text" autoComplete="address-level2" placeholder="City and country" required value={values.location} onChange={(e) => set('location', e.target.value)} {...field('location')} />
                  <Err id="location" />
                </div>
                <div className="field">
                  <label htmlFor="f-projectType">Project type</label>
                  <select className="select" required value={values.projectType} onChange={(e) => set('projectType', e.target.value)} {...field('projectType')}>
                    <option value="">Choose…</option>
                    {opts.projectTypes.map((o) => <option key={o}>{o}</option>)}
                  </select>
                  <Err id="projectType" />
                </div>
                <div className="field">
                  <label htmlFor="f-budgetRange">Budget range</label>
                  <select className="select" required value={values.budgetRange} onChange={(e) => set('budgetRange', e.target.value)} {...field('budgetRange')}>
                    <option value="">Choose…</option>
                    {opts.budgetRanges.map((o) => <option key={o}>{o}</option>)}
                  </select>
                  <p id="h-budgetRange" className="hint">Construction and design fees combined. An estimate is fine.</p>
                  <Err id="budgetRange" />
                </div>
                <div className="field span-2">
                  <label htmlFor="f-timeline">Timeline</label>
                  <select className="select" required value={values.timeline} onChange={(e) => set('timeline', e.target.value)} {...field('timeline')}>
                    <option value="">Choose…</option>
                    {opts.timelines.map((o) => <option key={o}>{o}</option>)}
                  </select>
                  <Err id="timeline" />
                </div>
                <div className="field span-2">
                  <label htmlFor="f-message">About your project</label>
                  <textarea className="textarea" rows={7} required value={values.message} onChange={(e) => set('message', e.target.value)} {...field('message')} />
                  <p id="h-message" className="hint">What do you want to build or change, and what matters most? {values.message.trim().length}/4000</p>
                  <Err id="message" />
                </div>
                <div className="field span-2">
                  <label htmlFor="f-attachment">Attachment <span className="optional">(optional)</span></label>
                  <div className="file-drop">
                    <input ref={fileRef} id="f-attachment" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={onFile} aria-invalid={errors.attachment ? true : undefined} aria-describedby={errors.attachment ? 'e-attachment' : 'h-attachment'} />
                    {file && <button type="button" className="btn btn-outline btn-sm" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; if (submitted) setErrors(validateEnquiry(values, null)); }}>Remove file</button>}
                  </div>
                  <p id="h-attachment" className="hint">A site plan, brief or inspiration. JPG, PNG, WebP or PDF, up to {MAX_ATTACHMENT_MB} MB. Allowed: {ALLOWED_EXT.source.replace(/\\\.\(|\)\$/g, '').replace(/\|/g, ', ').replace('jpe?g', 'jpg')}.</p>
                  <Err id="attachment" />
                </div>
                <div className="honeypot" aria-hidden="true">
                  <label htmlFor="f-website">Website (leave empty)</label>
                  <input id="f-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
                <div className="field span-2">
                  <div className="check">
                    <input type="checkbox" checked={values.consent} onChange={(e) => set('consent', e.target.checked)} {...field('consent')} />
                    <label htmlFor="f-consent">I agree that Atelier North may store my details to reply to this enquiry, as described in the <Link to="/privacy">privacy notice</Link>.</label>
                  </div>
                  <Err id="consent" />
                </div>
              </div>

              <div className="row" style={{ marginTop: 'var(--s-6)' }}>
                <button type="submit" className="btn" disabled={sending} aria-disabled={sending}>{sending ? 'Sending…' : 'Send enquiry'}</button>
                {sending && <span className="small muted" role="status">Sending your enquiry…</span>}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
