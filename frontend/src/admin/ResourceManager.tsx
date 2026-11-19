import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiError, api, useApi, useDebounced } from '../lib/api';
import type { Paged } from '../lib/types';
import { ErrorState, PageSkeleton } from '../components/States';
import { Pagination } from '../components/Pagination';
import { FormFields, setIn, type FieldSpec } from './fields';
import { Badge, ErrorSummary, errorMap, useUi } from './ui';

export interface Column {
  header: string;
  render: (row: any) => ReactNode;
}
export interface ResourceConfig {
  /** URL segment under /admin and /api/admin */
  key: string;
  singular: string;
  plural: string;
  intro: string;
  columns: Column[];
  fields: FieldSpec[];
  blank: () => Record<string, any>;
  /** how publish state is stored */
  publish: 'date' | 'flag' | 'none';
  /** supports PUT /order */
  orderable?: boolean;
  /** shows the featured-order panel (projects) */
  featuredOrdering?: boolean;
  /** name of the title-like field used in messages */
  titleField: string;
  /** public path for "View on site" */
  publicPath?: (row: any) => string | null;
}

export const isPublished = (row: any, mode: ResourceConfig['publish']) =>
  mode === 'date' ? !!row.publishedAt && new Date(row.publishedAt) <= new Date() : mode === 'flag' ? !!row.published : true;

const stateBadge = (row: any, mode: ResourceConfig['publish']) => {
  if (mode === 'none') return null;
  if (mode === 'date' && row.publishedAt && new Date(row.publishedAt) > new Date()) return <Badge kind="contacted">scheduled</Badge>;
  return isPublished(row, mode) ? <Badge kind="qualified">published</Badge> : <Badge kind="closed">draft</Badge>;
};

/* ============================ list ============================ */
export function ResourceList({ cfg }: { cfg: ResourceConfig }) {
  const { toast, confirm } = useUi();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const status = params.get('status') ?? '';
  const [q, setQ] = useState(params.get('q') ?? '');
  const dq = useDebounced(q, 300);
  useEffect(() => {
    const next = new URLSearchParams(params);
    if (dq) next.set('q', dq);
    else next.delete('q');
    if ((params.get('q') ?? '') !== dq) {
      next.delete('page');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);

  const path = `/api/admin/${cfg.key}?page=${page}&limit=20${params.get('q') ? `&q=${encodeURIComponent(params.get('q')!)}` : ''}${status ? `&status=${status}` : ''}`;
  const { data, error, loading, reload } = useApi<Paged<any>>(path);
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (row: any, kind: 'publish' | 'unpublish') => {
    setBusy(row.id);
    try {
      await api.post(`/api/admin/${cfg.key}/${row.id}/${kind}`);
      toast(kind === 'publish' ? 'Published' : 'Unpublished');
      reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(null);
    }
  };
  const remove = async (row: any) => {
    const ok = await confirm({ title: `Delete this ${cfg.singular}?`, message: `“${row[cfg.titleField]}” will be removed permanently. This cannot be undone.`, confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      await api.del(`/api/admin/${cfg.key}/${row.id}`);
      toast('Deleted');
      reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };
  const reorder = async (i: number, d: number) => {
    if (!data) return;
    const ids = data.data.map((r) => r.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    try {
      await api.put(`/api/admin/${cfg.key}/order`, { ids });
      toast('Order saved');
      reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const canReorder = cfg.orderable && !params.get('q') && !status && (data?.meta.totalPages ?? 1) <= 1;

  return (
    <div>
      <div className="admin-head">
        <div>
          <h1>{cfg.plural}</h1>
          <p className="muted">{cfg.intro}</p>
        </div>
        <Link className="btn" to={`/admin/${cfg.key}/new`}>New {cfg.singular}</Link>
      </div>

      {cfg.featuredOrdering && <FeaturedOrder onSaved={reload} />}

      <div className="toolbar">
        <div className="field">
          <label htmlFor="list-q">Search {cfg.plural.toLowerCase()}</label>
          <input id="list-q" className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {cfg.publish !== 'none' && (
          <div className="field">
            <label htmlFor="list-status">Status</label>
            <select id="list-status" className="select" value={status} onChange={(e) => { const n = new URLSearchParams(params); if (e.target.value) n.set('status', e.target.value); else n.delete('status'); n.delete('page'); setParams(n); }}>
              <option value="">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        )}
      </div>

      {loading && !data && <PageSkeleton />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.data.length === 0 && (
        <div className="state"><h2>No {cfg.plural.toLowerCase()} found</h2><p className="muted">{q || status ? 'Try a different search or clear the status filter.' : `Create your first ${cfg.singular.toLowerCase()} to get started.`}</p><Link className="btn" to={`/admin/${cfg.key}/new`}>New {cfg.singular}</Link></div>
      )}
      {data && data.data.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">{cfg.plural}. {data.meta.total} in total.</caption>
            <thead>
              <tr>
                {cfg.columns.map((c) => <th scope="col" key={c.header}>{c.header}</th>)}
                {cfg.publish !== 'none' && <th scope="col">Status</th>}
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((row, i) => (
                <tr key={row.id}>
                  {cfg.columns.map((c, ci) => <td key={c.header}>{ci === 0 ? <Link to={`/admin/${cfg.key}/${row.id}`}>{c.render(row)}</Link> : c.render(row)}</td>)}
                  {cfg.publish !== 'none' && <td>{stateBadge(row, cfg.publish)}</td>}
                  <td>
                    <div className="row" style={{ gap: 'var(--s-2)' }}>
                      <Link className="btn btn-outline btn-sm" to={`/admin/${cfg.key}/${row.id}`}>Edit<span className="sr-only"> {row[cfg.titleField]}</span></Link>
                      {cfg.publish !== 'none' && (
                        <button type="button" className="btn btn-outline btn-sm" disabled={busy === row.id} onClick={() => act(row, isPublished(row, cfg.publish) ? 'unpublish' : 'publish')}>
                          {isPublished(row, cfg.publish) ? 'Unpublish' : 'Publish'}<span className="sr-only"> {row[cfg.titleField]}</span>
                        </button>
                      )}
                      {canReorder && (
                        <>
                          <button type="button" className="btn btn-outline btn-sm" disabled={i === 0} onClick={() => reorder(i, -1)} aria-label={`Move ${row[cfg.titleField]} up`}>Up</button>
                          <button type="button" className="btn btn-outline btn-sm" disabled={i === data.data.length - 1} onClick={() => reorder(i, 1)} aria-label={`Move ${row[cfg.titleField]} down`}>Down</button>
                        </>
                      )}
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => remove(row)}>Delete<span className="sr-only"> {row[cfg.titleField]}</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} />}
    </div>
  );
}

/* ============================ featured ordering ============================ */
function FeaturedOrder({ onSaved }: { onSaved: () => void }) {
  const { toast } = useUi();
  const { data, reload } = useApi<Paged<any>>('/api/admin/projects?limit=100');
  const [ids, setIds] = useState<string[] | null>(null);
  const featured = useMemo(() => (data?.data ?? []).filter((p) => p.featured).sort((a, b) => a.featuredOrder - b.featuredOrder), [data]);
  const order = ids ?? featured.map((p) => p.id);
  const byId = (id: string) => data?.data.find((p) => p.id === id);
  const others = (data?.data ?? []).filter((p) => !order.includes(p.id));

  const move = (i: number, d: number) => {
    const c = [...order];
    const j = i + d;
    if (j < 0 || j >= c.length) return;
    [c[i], c[j]] = [c[j], c[i]];
    setIds(c);
  };
  const save = async () => {
    try {
      await api.put('/api/admin/projects/featured-order', { ids: order });
      toast('Featured projects saved');
      setIds(null);
      reload();
      onSaved();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };
  if (!data) return null;
  return (
    <details className="panel" style={{ marginBottom: 'var(--s-6)' }}>
      <summary><strong>Featured projects on the home page ({order.length})</strong></summary>
      <p className="muted small">The first projects in this list appear in “Selected projects” on the home page, in this order.</p>
      <ol className="stack">
        {order.map((id, i) => (
          <li key={id} className="row" style={{ flexWrap: 'nowrap' }}>
            <span style={{ flex: 1 }}>{byId(id)?.title}</span>
            <button type="button" className="btn btn-outline btn-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${byId(id)?.title} up`}>Up</button>
            <button type="button" className="btn btn-outline btn-sm" disabled={i === order.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${byId(id)?.title} down`}>Down</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setIds(order.filter((x) => x !== id))} aria-label={`Remove ${byId(id)?.title} from featured`}>Remove</button>
          </li>
        ))}
      </ol>
      {others.length > 0 && (
        <div className="field" style={{ maxWidth: 420, marginTop: 'var(--s-4)' }}>
          <label htmlFor="feat-add">Add a project to featured</label>
          <select id="feat-add" className="select" value="" onChange={(e) => e.target.value && setIds([...order, e.target.value])}>
            <option value="">Choose a project…</option>
            {others.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      )}
      <div className="row" style={{ marginTop: 'var(--s-4)' }}>
        <button type="button" className="btn" onClick={save} disabled={ids === null}>Save featured order</button>
        {ids !== null && <button type="button" className="btn btn-outline" onClick={() => setIds(null)}>Discard changes</button>}
      </div>
    </details>
  );
}

/* ============================ edit / create ============================ */
export function ResourceEdit({ cfg }: { cfg: ResourceConfig }) {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const nav = useNavigate();
  const { toast } = useUi();
  const loaded = useApi<{ data: any }>(isNew ? null : `/api/admin/${cfg.key}/${id}`);
  const [form, setForm] = useState<any>(() => cfg.blank());
  const [initial, setInitial] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<ApiError | string | null>(null);
  const [items, setItems] = useState<{ path: string; message: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) {
      const b = cfg.blank();
      setForm(b);
      setInitial(JSON.stringify(b));
    } else if (loaded.data) {
      const d = normalise(loaded.data.data, cfg);
      setForm(d);
      setInitial(JSON.stringify(d));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded.data, isNew, cfg.key]);

  const dirty = JSON.stringify(form) !== initial;
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const change = (path: string, v: any) => setForm((f: any) => setIn(f, path, v));

  const save = async (e: FormEvent, then: 'stay' | 'list' = 'stay') => {
    e.preventDefault();
    setSaving(true);
    setSummary(null);
    setErrors({});
    setItems([]);
    try {
      const payload = toPayload(form, cfg);
      const res = isNew ? await api.post<{ data: any }>(`/api/admin/${cfg.key}`, payload) : await api.put<{ data: any }>(`/api/admin/${cfg.key}/${id}`, payload);
      toast(`${cfg.singular} saved`);
      const d = normalise(res.data, cfg);
      setForm(d);
      setInitial(JSON.stringify(d));
      if (then === 'list') nav(`/admin/${cfg.key}`);
      else if (isNew) nav(`/admin/${cfg.key}/${res.data.id}`, { replace: true });
    } catch (err) {
      setErrors(errorMap(err));
      setSummary(err instanceof ApiError ? err : 'Could not save.');
      setItems(err instanceof ApiError ? err.details ?? [] : []);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('.alert-error')?.focus());
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (kind: 'publish' | 'unpublish') => {
    try {
      const res = await api.post<{ data: any }>(`/api/admin/${cfg.key}/${id}/${kind}`);
      const d = normalise(res.data, cfg);
      setForm((f: any) => ({ ...f, publishedAt: d.publishedAt, published: d.published }));
      setInitial((s) => JSON.stringify({ ...JSON.parse(s), publishedAt: d.publishedAt, published: d.published }));
      toast(kind === 'publish' ? 'Published' : 'Unpublished');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  if (!isNew && loaded.loading) return <PageSkeleton />;
  if (!isNew && loaded.error) return <ErrorState error={loaded.error} onRetry={loaded.reload} title={`We could not load this ${cfg.singular.toLowerCase()}`} />;

  const published = isPublished(form, cfg.publish);
  const pub = cfg.publicPath?.(form);
  return (
    <div>
      <nav aria-label="Breadcrumb" className="small"><Link to={`/admin/${cfg.key}`}>{cfg.plural}</Link> / <span aria-current="page">{isNew ? `New ${cfg.singular.toLowerCase()}` : form[cfg.titleField] || cfg.singular}</span></nav>
      <div className="admin-head">
        <h1>{isNew ? `New ${cfg.singular.toLowerCase()}` : `Edit ${cfg.singular.toLowerCase()}`}</h1>
        <div className="row">
          {!isNew && cfg.publish !== 'none' && (
            <button type="button" className="btn btn-outline" onClick={() => toggle(published ? 'unpublish' : 'publish')} disabled={dirty} title={dirty ? 'Save your changes first' : undefined}>{published ? 'Unpublish' : 'Publish'}</button>
          )}
          {!isNew && pub && published && <a className="btn btn-outline" href={pub} target="_blank" rel="noopener noreferrer">View on site<span className="sr-only"> (opens in a new tab)</span></a>}
        </div>
      </div>
      {!isNew && cfg.publish !== 'none' && <p>{stateBadge(form, cfg.publish)} {dirty && <span className="small muted">Unsaved changes</span>}</p>}

      <form onSubmit={save} noValidate aria-label={`${cfg.singular} form`}>
        <ErrorSummary error={summary} items={items} />
        <div className="form-grid form-grid--2">
          <FormFields fields={cfg.fields} value={form} onChange={change} errors={errors} />
        </div>
        <div className="row sticky-actions">
          <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : `Save ${cfg.singular.toLowerCase()}`}</button>
          <button className="btn btn-outline" type="button" disabled={saving} onClick={(e) => save(e as unknown as FormEvent, 'list')}>Save and close</button>
          <Link className="btn btn-outline" to={`/admin/${cfg.key}`}>{dirty ? 'Discard and close' : 'Close'}</Link>
        </div>
      </form>
    </div>
  );
}

/* ---- payload helpers: the API stores clean values, the form needs controlled ones ---- */
function normalise(doc: any, cfg: ResourceConfig) {
  const base = cfg.blank();
  const out: any = { ...base };
  for (const k of Object.keys(base)) if (doc[k] !== undefined) out[k] = doc[k];
  out.id = doc.id;
  if ('projectId' in base) out.projectId = doc.projectId && typeof doc.projectId === 'object' ? doc.projectId.id : doc.projectId ?? null;
  return out;
}
function toPayload(form: any, cfg: ResourceConfig) {
  const base = cfg.blank();
  const out: any = {};
  for (const k of Object.keys(base)) {
    let v = form[k];
    if (typeof base[k] === 'number' && v === '') v = 0;
    out[k] = v;
  }
  return out;
}
