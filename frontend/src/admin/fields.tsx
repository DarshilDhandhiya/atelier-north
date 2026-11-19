import { useEffect, useRef, useState } from 'react';
import { api, useApi } from '../lib/api';
import { sizedUrl } from '../lib/images';
import type { ImageRef, MediaItem, Paged, Project } from '../lib/types';
import { useUi } from './ui';

/* ---------- field specs ---------- */
export type FieldSpec =
  | { type: 'section'; title: string }
  | { type: 'text' | 'textarea' | 'number' | 'email' | 'url' | 'date'; name: string; label: string; hint?: string; rows?: number; placeholder?: string; required?: boolean; half?: boolean }
  | { type: 'checkbox'; name: string; label: string; hint?: string }
  | { type: 'select'; name: string; label: string; options: { value: string; label: string }[]; hint?: string; half?: boolean }
  | { type: 'projectSelect'; name: string; label: string; hint?: string }
  | { type: 'richtext'; name: string; label: string; hint?: string }
  | { type: 'image'; name: string; label: string; hint?: string; optional?: boolean }
  | { type: 'images'; name: string; label: string; hint?: string }
  | { type: 'strings'; name: string; label: string; hint?: string; placeholder?: string }
  | { type: 'objects'; name: string; label: string; itemLabel: string; fields: FieldSpec[]; blank: Record<string, unknown>; hint?: string };

/* ---------- path helpers ---------- */
export const getIn = (o: any, path: string): any => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
export const setIn = (o: any, path: string, v: any): any => {
  const [h, ...rest] = path.split('.');
  const clone: any = Array.isArray(o) ? [...o] : { ...(o ?? {}) };
  clone[h] = rest.length ? setIn(o?.[h] ?? (/^\d+$/.test(rest[0]) ? [] : {}), rest.join('.'), v) : v;
  return clone;
};
const idOf = (path: string) => `fld-${path.replace(/\./g, '-')}`;
const errorsUnder = (errors: Record<string, string>, path: string) => Object.entries(errors).filter(([k]) => k === path || k.startsWith(`${path}.`)).map(([, v]) => v);
const move = <T,>(arr: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
};

interface FormProps {
  fields: FieldSpec[];
  value: any;
  onChange: (path: string, v: any) => void;
  errors: Record<string, string>;
  prefix?: string;
}

/** Renders a list of field specs against a value object. Paths are dot-separated and absolute from the form root. */
export function FormFields({ fields, value, onChange, errors, prefix = '' }: FormProps) {
  return (
    <>
      {fields.map((f, i) => {
        if (f.type === 'section') return <h2 key={`s${i}`} className="form-section span-2">{f.title}</h2>;
        const path = prefix + f.name;
        return <Field key={path} spec={f} path={path} value={getIn(value, path)} onChange={onChange} errors={errors} root={value} />;
      })}
    </>
  );
}

function Field({ spec, path, value, onChange, errors, root }: { spec: Exclude<FieldSpec, { type: 'section' }>; path: string; value: any; onChange: FormProps['onChange']; errors: Record<string, string>; root: any }) {
  const id = idOf(path);
  const err = errors[path];
  const hintId = spec.hint ? `${id}-h` : undefined;
  const errId = err ? `${id}-e` : undefined;
  const describedBy = [errId, hintId].filter(Boolean).join(' ') || undefined;
  const wrap = (child: React.ReactNode, labelFor = true, full = true) => (
    <div className={`field ${full && !('half' in spec && spec.half) ? 'span-2' : ''}`}>
      {labelFor ? <label htmlFor={id}>{spec.label}</label> : <span className="field-label" id={`${id}-l`}>{spec.label}</span>}
      {child}
      {spec.hint && <p id={hintId} className="hint">{spec.hint}</p>}
      {err && <p id={errId} className="field-error">{err}</p>}
    </div>
  );

  switch (spec.type) {
    case 'text':
    case 'email':
    case 'url':
    case 'number':
      return wrap(<input id={id} className="input" type={spec.type} value={value ?? ''} placeholder={spec.placeholder} aria-invalid={err ? true : undefined} aria-describedby={describedBy} onChange={(e) => onChange(path, spec.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} />, true, !spec.half);
    case 'date':
      return wrap(<input id={id} className="input" type="date" value={value ? String(value).slice(0, 10) : ''} aria-describedby={describedBy} onChange={(e) => onChange(path, e.target.value ? new Date(`${e.target.value}T09:00:00Z`).toISOString() : null)} />, true, false);
    case 'textarea':
      return wrap(<textarea id={id} className="textarea" rows={spec.rows ?? 5} value={value ?? ''} aria-invalid={err ? true : undefined} aria-describedby={describedBy} onChange={(e) => onChange(path, e.target.value)} />);
    case 'checkbox':
      return (
        <div className="field span-2">
          <div className="check">
            <input id={id} type="checkbox" checked={!!value} aria-describedby={describedBy} onChange={(e) => onChange(path, e.target.checked)} />
            <label htmlFor={id}>{spec.label}</label>
          </div>
          {spec.hint && <p id={hintId} className="hint">{spec.hint}</p>}
        </div>
      );
    case 'select':
      return wrap(
        <select id={id} className="select" value={value ?? ''} aria-describedby={describedBy} onChange={(e) => onChange(path, e.target.value)}>
          {spec.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>,
        true,
        false,
      );
    case 'projectSelect':
      return wrap(<ProjectSelect id={id} value={typeof value === 'object' && value ? value.id ?? value._id : value} onChange={(v) => onChange(path, v)} describedBy={describedBy} />);
    case 'richtext':
      return wrap(<RichText id={id} value={value ?? ''} onChange={(v) => onChange(path, v)} label={spec.label} invalid={!!err} describedBy={describedBy} />, false);
    case 'image':
      return (
        <div className="field span-2">
          <span className="field-label" id={`${id}-l`}>{spec.label}</span>
          <ImageField id={id} value={value} optional={spec.optional} onChange={(v) => onChange(path, v)} errors={errorsUnder(errors, path)} />
          {spec.hint && <p className="hint">{spec.hint}</p>}
        </div>
      );
    case 'images':
      return (
        <div className="field span-2">
          <span className="field-label" id={`${id}-l`}>{spec.label}</span>
          {spec.hint && <p className="hint">{spec.hint}</p>}
          <div className="stack-lg">
            {(value ?? []).map((img: ImageRef, i: number) => (
              <fieldset key={i} className="list-item">
                <legend>Image {i + 1}</legend>
                <ImageField id={`${id}-${i}`} value={img} onChange={(v) => onChange(path, (value as ImageRef[]).map((x, j) => (j === i ? v : x)))} errors={errorsUnder(errors, `${path}.${i}`)} />
                <ListControls i={i} n={value.length} onMove={(d) => onChange(path, move(value, i, d))} onRemove={() => onChange(path, (value as ImageRef[]).filter((_, j) => j !== i))} what="image" />
              </fieldset>
            ))}
            <div><button type="button" className="btn btn-outline btn-sm" onClick={() => onChange(path, [...(value ?? []), { url: '', alt: '' }])}>Add image</button></div>
          </div>
        </div>
      );
    case 'strings':
      return (
        <div className="field span-2">
          <span className="field-label" id={`${id}-l`}>{spec.label}</span>
          {spec.hint && <p className="hint">{spec.hint}</p>}
          <div className="stack">
            {(value ?? []).map((s: string, i: number) => (
              <div className="row" key={i} style={{ flexWrap: 'nowrap' }}>
                <input id={`${id}-${i}`} className="input" aria-label={`${spec.label} ${i + 1}`} value={s} placeholder={spec.placeholder} aria-invalid={errors[`${path}.${i}`] ? true : undefined} onChange={(e) => onChange(path, (value as string[]).map((x, j) => (j === i ? e.target.value : x)))} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange(path, move(value, i, -1))} disabled={i === 0} aria-label={`Move ${spec.label} ${i + 1} up`}>Up</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange(path, move(value, i, 1))} disabled={i === value.length - 1} aria-label={`Move ${spec.label} ${i + 1} down`}>Down</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange(path, (value as string[]).filter((_, j) => j !== i))} aria-label={`Remove ${spec.label} ${i + 1}`}>Remove</button>
              </div>
            ))}
            {errorsUnder(errors, path).map((m) => <p key={m} className="field-error">{m}</p>)}
            <div><button type="button" className="btn btn-outline btn-sm" onClick={() => onChange(path, [...(value ?? []), ''])}>Add item</button></div>
          </div>
        </div>
      );
    case 'objects':
      return (
        <div className="field span-2">
          <span className="field-label" id={`${id}-l`}>{spec.label}</span>
          {spec.hint && <p className="hint">{spec.hint}</p>}
          <div className="stack-lg">
            {(value ?? []).map((_: unknown, i: number) => (
              <fieldset key={i} className="list-item">
                <legend>{spec.itemLabel} {i + 1}</legend>
                <div className="form-grid">
                  <FormFields fields={spec.fields} value={root} onChange={onChange} errors={errors} prefix={`${path}.${i}.`} />
                </div>
                <ListControls i={i} n={value.length} onMove={(d) => onChange(path, move(value, i, d))} onRemove={() => onChange(path, (value as unknown[]).filter((_, j) => j !== i))} what={spec.itemLabel.toLowerCase()} />
              </fieldset>
            ))}
            <div><button type="button" className="btn btn-outline btn-sm" onClick={() => onChange(path, [...(value ?? []), { ...spec.blank }])}>Add {spec.itemLabel.toLowerCase()}</button></div>
          </div>
        </div>
      );
  }
}

function ListControls({ i, n, onMove, onRemove, what }: { i: number; n: number; onMove: (d: number) => void; onRemove: () => void; what: string }) {
  return (
    <div className="row" style={{ marginTop: 'var(--s-3)' }}>
      <button type="button" className="btn btn-outline btn-sm" disabled={i === 0} onClick={() => onMove(-1)}>Move up</button>
      <button type="button" className="btn btn-outline btn-sm" disabled={i === n - 1} onClick={() => onMove(1)}>Move down</button>
      <button type="button" className="btn btn-outline btn-sm" onClick={onRemove}>Remove {what}</button>
    </div>
  );
}

function ProjectSelect({ id, value, onChange, describedBy }: { id: string; value: string | null; onChange: (v: string | null) => void; describedBy?: string }) {
  const { data } = useApi<Paged<Project>>('/api/admin/projects?limit=100');
  return (
    <select id={id} className="select" value={value ?? ''} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">No linked project</option>
      {data?.data.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
    </select>
  );
}

/* ---------- image field ---------- */
export function ImageField({ id, value, onChange, optional, errors = [] }: { id: string; value?: ImageRef | null; onChange: (v: ImageRef | null) => void; optional?: boolean; errors?: string[] }) {
  const { toast } = useUi();
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const img = value ?? { url: '', alt: '' };

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('alt', img.alt || '');
      const res = await api.post<{ data: MediaItem & { attribution?: ImageRef['attribution'] } }>('/api/admin/media', fd);
      onChange({ url: res.data.url, alt: img.alt || res.data.alt || '', width: res.data.width, height: res.data.height, attribution: res.data.attribution });
      toast('Image uploaded');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="image-field">
      <div className="image-field-preview">
        {img.url ? <img src={sizedUrl(img.url, 320, 220)} alt="" /> : <span className="muted small">No image yet</span>}
      </div>
      <div className="stack" style={{ flex: 1, minWidth: 0 }}>
        <div className="field">
          <label htmlFor={`${id}-alt`}>Alt text <span className="optional">(describe the image for people who cannot see it)</span></label>
          <input id={`${id}-alt`} className="input" value={img.alt} onChange={(e) => onChange({ ...img, alt: e.target.value })} aria-invalid={errors.some((e) => /alt|describe/i.test(e)) || undefined} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-url`}>Image URL</label>
          <input id={`${id}-url`} className="input" value={img.url} placeholder="Upload a file, choose from the library, or paste a URL" onChange={(e) => onChange({ ...img, url: e.target.value, attribution: undefined })} />
        </div>
        <div className="row">
          <input ref={fileRef} id={id} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <label htmlFor={id} className={`btn btn-sm ${busy ? '' : ''}`} style={{ cursor: 'pointer' }} aria-disabled={busy}>{busy ? 'Uploading…' : 'Upload image'}</label>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setPicker(true)}>Choose from library</button>
          {optional && img.url && <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange(null)}>Remove image</button>}
        </div>
        {img.attribution?.creator && <p className="hint">Credit: {img.attribution.creator}{img.attribution.source ? ` / ${img.attribution.source}` : ''}</p>}
        {errors.map((m) => <p key={m} className="field-error">{m}</p>)}
      </div>
      {picker && <MediaPicker onClose={() => setPicker(false)} onPick={(m) => { onChange({ url: m.url, alt: img.alt || m.alt || '', width: m.width, height: m.height }); setPicker(false); }} />}
    </div>
  );
}

function MediaPicker({ onPick, onClose }: { onPick: (m: MediaItem) => void; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useApi<Paged<MediaItem>>(`/api/admin/media?limit=12&page=${page}`);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="mp-t" style={{ width: 'min(820px,100%)' }}>
        <h2 id="mp-t">Media library</h2>
        {loading && <p role="status">Loading…</p>}
        {error && <p className="alert alert-error">{error.message}</p>}
        {data && data.data.length === 0 && <p className="muted">Nothing uploaded yet. Use “Upload image” to add your first file.</p>}
        <ul className="media-grid" role="list">
          {data?.data.map((m) => (
            <li key={m.id}><button type="button" onClick={() => onPick(m)} aria-label={`Use ${m.alt || 'image'} uploaded ${new Date(m.createdAt).toLocaleDateString('en-GB')}`}><img src={sizedUrl(m.url, 200, 150)} alt="" /></button></li>
          ))}
        </ul>
        <div className="row" style={{ marginTop: 'var(--s-4)', justifyContent: 'space-between' }}>
          <div className="row">
            <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button type="button" className="btn btn-outline btn-sm" disabled={!data || page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
          <button ref={closeRef} type="button" className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- rich text ---------- */
export function RichText({ id, value, onChange, label, invalid, describedBy }: { id: string; value: string; onChange: (v: string) => void; label: string; invalid?: boolean; describedBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const saved = useRef<Range | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState('https://');

  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value && document.activeElement !== el) el.innerHTML = value || '';
  }, [value]);

  const emit = () => onChange(ref.current?.innerHTML ?? '');
  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };
  const tool = (text: string, cmd: string, arg?: string, aria?: string) => (
    <button type="button" className="btn btn-outline btn-sm" aria-label={aria ?? text} onMouseDown={(e) => e.preventDefault()} onClick={() => exec(cmd, arg)}>{text}</button>
  );
  const openLink = () => {
    const sel = window.getSelection();
    saved.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    setLinkOpen(true);
  };
  const applyLink = () => {
    ref.current?.focus();
    const sel = window.getSelection();
    if (saved.current && sel) {
      sel.removeAllRanges();
      sel.addRange(saved.current);
    }
    if (/^(https?:\/\/|mailto:)/i.test(url)) document.execCommand('createLink', false, url);
    setLinkOpen(false);
    emit();
  };

  return (
    <div className={`richtext ${invalid ? 'is-invalid' : ''}`}>
      <div className="richtext-toolbar" role="toolbar" aria-label={`${label} formatting`}>
        {tool('Heading', 'formatBlock', 'h2', 'Heading')}
        {tool('Subheading', 'formatBlock', 'h3')}
        {tool('Paragraph', 'formatBlock', 'p')}
        {tool('Bold', 'bold')}
        {tool('Italic', 'italic')}
        {tool('Bullets', 'insertUnorderedList', undefined, 'Bulleted list')}
        {tool('Numbers', 'insertOrderedList', undefined, 'Numbered list')}
        {tool('Quote', 'formatBlock', 'blockquote')}
        <button type="button" className="btn btn-outline btn-sm" onMouseDown={(e) => e.preventDefault()} onClick={openLink}>Link</button>
        {tool('Unlink', 'unlink', undefined, 'Remove link')}
        {tool('Clear', 'removeFormat', undefined, 'Clear formatting')}
      </div>
      {linkOpen && (
        <div className="row richtext-link">
          <label htmlFor={`${id}-link`} className="sr-only">Link address</label>
          <input id={`${id}-link`} className="input" value={url} onChange={(e) => setUrl(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyLink())} />
          <button type="button" className="btn btn-sm" onClick={applyLink}>Apply link</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setLinkOpen(false)}>Cancel</button>
        </div>
      )}
      <div ref={ref} id={id} className="richtext-editor prose" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-labelledby={`${id}-l`} aria-describedby={describedBy} tabIndex={0} onInput={emit} onBlur={emit} />
    </div>
  );
}
