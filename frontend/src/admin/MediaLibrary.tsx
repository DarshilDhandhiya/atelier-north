import { useRef, useState, type FormEvent } from 'react';
import { ApiError, api, useApi } from '../lib/api';
import { sizedUrl } from '../lib/images';
import type { MediaItem, Paged } from '../lib/types';
import { ErrorState, PageSkeleton } from '../components/States';
import { useUi } from './ui';

export function MediaLibrary() {
  const { toast, confirm } = useUi();
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi<Paged<MediaItem>>(`/api/admin/media?limit=24&page=${page}`);
  const [alt, setAlt] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (e: FormEvent) => {
    e.preventDefault();
    const f = fileRef.current?.files?.[0];
    setErr(null);
    if (!f) return setErr('Choose an image to upload.');
    if (f.size > 8 * 1024 * 1024) return setErr('That image is larger than 8 MB. Choose a smaller one.');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('alt', alt);
      await api.post('/api/admin/media', fd);
      toast('Image uploaded');
      setAlt('');
      if (fileRef.current) fileRef.current.value = '';
      setPage(1);
      reload();
    } catch (e2) {
      setErr((e2 as ApiError).message);
    } finally {
      setBusy(false);
    }
  };
  const saveAlt = async (m: MediaItem, value: string) => {
    if (value === m.alt) return;
    try {
      await api.put(`/api/admin/media/${m.id}`, { alt: value });
      toast('Alt text saved');
      reload();
    } catch (e2) {
      toast((e2 as Error).message, 'error');
    }
  };
  const remove = async (m: MediaItem) => {
    if (!(await confirm({ title: 'Delete this image?', message: 'Pages that still use it will show a broken image until you replace it.', confirmLabel: 'Delete image', danger: true }))) return;
    try {
      await api.del(`/api/admin/media/${m.id}`);
      toast('Image deleted');
      reload();
    } catch (e2) {
      toast((e2 as Error).message, 'error');
    }
  };

  return (
    <div>
      <div className="admin-head"><div><h1>Media library</h1><p className="muted">Upload JPG, PNG or WebP images up to 8 MB. Files are checked by content, not just by name.</p></div></div>
      <form className="panel" onSubmit={upload} noValidate aria-label="Upload an image" style={{ marginBottom: 'var(--s-6)' }}>
        <div className="form-grid form-grid--2">
          <div className="field"><label htmlFor="m-file">Image</label><input ref={fileRef} id="m-file" type="file" accept="image/jpeg,image/png,image/webp" aria-invalid={err ? true : undefined} aria-describedby={err ? 'm-err' : undefined} /></div>
          <div className="field"><label htmlFor="m-alt">Alt text</label><input id="m-alt" className="input" value={alt} onChange={(e) => setAlt(e.target.value)} /></div>
        </div>
        {err && <p id="m-err" className="field-error" role="alert">{err}</p>}
        <div style={{ marginTop: 'var(--s-4)' }}><button className="btn" type="submit" disabled={busy}>{busy ? 'Uploading…' : 'Upload image'}</button></div>
      </form>

      {loading && !data && <PageSkeleton />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.data.length === 0 && <div className="state"><h2>No uploads yet</h2><p className="muted">Images you upload here can be reused on projects, articles and pages.</p></div>}
      {data && data.data.length > 0 && (
        <ul className="media-grid media-grid--lg" role="list">
          {data.data.map((m) => (
            <li key={m.id}>
              <img src={sizedUrl(m.url, 320, 220)} alt={m.alt || ''} loading="lazy" />
              <div className="field">
                <label htmlFor={`alt-${m.id}`}>Alt text</label>
                <input id={`alt-${m.id}`} className="input" defaultValue={m.alt} onBlur={(e) => saveAlt(m, e.target.value)} />
              </div>
              <p className="small muted">{m.width}×{m.height}{m.size ? ` · ${Math.round(m.size / 1024)} KB` : ''}</p>
              <div className="row"><button type="button" className="btn btn-outline btn-sm" onClick={() => navigator.clipboard?.writeText(m.url).then(() => toast('Link copied'))}>Copy link</button><button type="button" className="btn btn-outline btn-sm" onClick={() => remove(m)}>Delete</button></div>
            </li>
          ))}
        </ul>
      )}
      {data && data.meta.totalPages > 1 && (
        <div className="row" style={{ marginTop: 'var(--s-5)' }}>
          <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="small" aria-live="polite">Page {page} of {data.meta.totalPages}</span>
          <button type="button" className="btn btn-outline btn-sm" disabled={page >= data.meta.totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
