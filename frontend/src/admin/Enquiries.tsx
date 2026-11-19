import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { API_BASE, ApiError, api, qs, useApi, useDebounced } from '../lib/api';
import { formatDate } from '../lib/format';
import type { AdminUser, Enquiry, Paged } from '../lib/types';
import { ErrorState, PageSkeleton } from '../components/States';
import { Pagination } from '../components/Pagination';
import { Badge, useUi } from './ui';

const STATUSES = ['new', 'contacted', 'qualified', 'closed'] as const;
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const bytes = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export function EnquiryList() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const status = params.get('status') ?? '';
  const emailStatus = params.get('emailStatus') ?? '';
  const [q, setQ] = useState(params.get('q') ?? '');
  const dq = useDebounced(q, 300);
  useEffect(() => {
    if ((params.get('q') ?? '') === dq) return;
    const n = new URLSearchParams(params);
    if (dq) n.set('q', dq);
    else n.delete('q');
    n.delete('page');
    setParams(n, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq]);

  const query = { page, limit: 20, q: params.get('q') ?? '', status, emailStatus };
  const { data, error, loading, reload } = useApi<Paged<Enquiry> & { counts: Record<string, number> }>(`/api/admin/enquiries${qs(query)}`);
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(params);
    if (v) n.set(k, v);
    else n.delete(k);
    n.delete('page');
    setParams(n);
  };

  return (
    <div>
      <div className="admin-head">
        <div>
          <h1>Enquiries</h1>
          <p className="muted">Consultation requests from the contact form. Only admins can see these.</p>
        </div>
        <a className="btn btn-outline" href={`${API_BASE}/api/admin/enquiries/export.csv${qs({ q: query.q, status, emailStatus })}`}>Export CSV</a>
      </div>

      <div className="chips" role="group" aria-label="Filter by status">
        <button type="button" className="chip" aria-pressed={!status} onClick={() => set('status', '')}>All</button>
        {STATUSES.map((s) => (
          <button type="button" key={s} className="chip" aria-pressed={status === s} onClick={() => set('status', status === s ? '' : s)}>
            {s} {data?.counts ? `(${data.counts[s] ?? 0})` : ''}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="enq-q">Search by name, email, reference or message</label>
          <input id="enq-q" className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="enq-email">Email notification</label>
          <select id="enq-email" className="select" value={emailStatus} onChange={(e) => set('emailStatus', e.target.value)}>
            <option value="">Any</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      {loading && !data && <PageSkeleton />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.data.length === 0 && <div className="state"><h2>No enquiries found</h2><p className="muted">{q || status || emailStatus ? 'Try clearing a filter or searching for something else.' : 'New enquiries from the contact form will appear here.'}</p></div>}
      {data && data.data.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Enquiries, newest first. {data.meta.total} match.</caption>
            <thead><tr><th scope="col">Reference</th><th scope="col">From</th><th scope="col">Project</th><th scope="col">Received</th><th scope="col">Status</th><th scope="col">Email</th></tr></thead>
            <tbody>
              {data.data.map((e) => (
                <tr key={e.id}>
                  <td><Link to={`/admin/enquiries/${e.id}`}>{e.reference}</Link></td>
                  <td>{e.name}<br /><span className="small muted">{e.email}</span></td>
                  <td>{e.projectType}<br /><span className="small muted">{e.location}</span></td>
                  <td>{when(e.createdAt)}</td>
                  <td><Badge kind={e.status} /></td>
                  <td>{e.emailStatus === 'failed' ? <Badge kind="failed">failed</Badge> : <span className="muted">{e.emailStatus}</span>}</td>
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

export function EnquiryDetail() {
  const { id } = useParams();
  const { toast, confirm } = useUi();
  const { data, error, loading, reload } = useApi<{ data: Enquiry }>(`/api/admin/enquiries/${id}`);
  const users = useApi<{ data: AdminUser[] }>('/api/admin/users');
  const [e, setE] = useState<Enquiry | null>(null);
  const [note, setNote] = useState('');
  const [noteErr, setNoteErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (data) setE(data.data);
  }, [data]);

  if (loading && !e) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!e) return null;

  const patch = async (body: Record<string, unknown>, msg: string) => {
    try {
      const r = await api.patch<{ data: Enquiry }>(`/api/admin/enquiries/${e.id}`, body);
      setE(r.data);
      toast(msg);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };
  const addNote = async (ev: FormEvent) => {
    ev.preventDefault();
    setNoteErr(null);
    if (note.trim().length < 2) return setNoteErr('Write a note before saving.');
    setBusy(true);
    try {
      const r = await api.post<{ data: Enquiry }>(`/api/admin/enquiries/${e.id}/notes`, { body: note });
      setE(r.data);
      setNote('');
      toast('Note added');
    } catch (err) {
      setNoteErr((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  };
  const retry = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ data: Enquiry }>(`/api/admin/enquiries/${e.id}/retry-email`);
      setE(r.data);
      toast(r.data.emailStatus === 'sent' ? 'Notification email sent' : 'Email still failing. See the error below.', r.data.emailStatus === 'sent' ? 'ok' : 'error');
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!(await confirm({ title: 'Delete this enquiry?', message: `${e.reference} from ${e.name} and its attachment will be permanently deleted.`, confirmLabel: 'Delete enquiry', danger: true }))) return;
    try {
      await api.del(`/api/admin/enquiries/${e.id}`);
      toast('Enquiry deleted');
      window.location.assign('/admin/enquiries');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  return (
    <div>
      <nav aria-label="Breadcrumb" className="small"><Link to="/admin/enquiries">Enquiries</Link> / <span aria-current="page">{e.reference}</span></nav>
      <div className="admin-head">
        <div><h1>{e.reference}</h1><p className="muted">Received {when(e.createdAt)}</p></div>
        <button type="button" className="btn btn-outline" onClick={remove}>Delete enquiry</button>
      </div>

      {e.emailStatus === 'failed' && (
        <div className="alert alert-warn" role="alert">
          <h2>The staff notification email did not send</h2>
          <p>The enquiry is saved. {e.emailAttempts} attempt{e.emailAttempts === 1 ? '' : 's'} so far. The server retries automatically, or you can retry now.</p>
          {e.emailError && <p className="small">Last error: {e.emailError}</p>}
          <button type="button" className="btn btn-sm" onClick={retry} disabled={busy}>Retry email now</button>
        </div>
      )}

      <div className="detail-grid">
        <div className="stack-lg">
          <section className="panel" aria-labelledby="enq-msg">
            <h2 id="enq-msg">Message</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{e.message}</p>
            {e.attachment && (
              <p><a className="btn btn-outline btn-sm" href={`${API_BASE}/api/admin/enquiries/${e.id}/attachment`}>Download attachment</a> <span className="small muted">{e.attachment.originalName} ({bytes(e.attachment.size)})</span></p>
            )}
          </section>

          <section className="panel" aria-labelledby="enq-notes">
            <h2 id="enq-notes">Internal notes</h2>
            <p className="small muted">Only staff can see these. They are never shown to the client.</p>
            {e.notes.length === 0 && <p className="muted">No notes yet.</p>}
            <ul className="notes" role="list">
              {e.notes.map((n, i) => <li key={n._id ?? i}><p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{n.body}</p><p className="small muted">{n.authorName} · {when(n.createdAt)}</p></li>)}
            </ul>
            <form onSubmit={addNote} noValidate>
              <div className="field">
                <label htmlFor="note">Add a note</label>
                <textarea id="note" className="textarea" rows={3} value={note} onChange={(ev) => setNote(ev.target.value)} aria-invalid={noteErr ? true : undefined} aria-describedby={noteErr ? 'note-e' : undefined} />
                {noteErr && <p id="note-e" className="field-error">{noteErr}</p>}
              </div>
              <button className="btn btn-sm" type="submit" disabled={busy}>Save note</button>
            </form>
          </section>
        </div>

        <aside className="stack-lg">
          <section className="panel" aria-labelledby="enq-wf">
            <h2 id="enq-wf">Workflow</h2>
            <div className="field">
              <label htmlFor="enq-status">Status</label>
              <select id="enq-status" className="select" value={e.status} onChange={(ev) => patch({ status: ev.target.value }, `Status changed to ${ev.target.value}`)}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="enq-assignee">Assigned to</label>
              <select id="enq-assignee" className="select" value={e.assignee?.id ?? ''} onChange={(ev) => patch({ assignee: ev.target.value || null }, 'Assignee updated')}>
                <option value="">Unassigned</option>
                {users.data?.data.filter((u) => u.status === 'active').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </section>

          <section className="panel" aria-labelledby="enq-who">
            <h2 id="enq-who">Contact</h2>
            <dl className="kv">
              <div><dt>Name</dt><dd>{e.name}</dd></div>
              <div><dt>Email</dt><dd><a href={`mailto:${e.email}`}>{e.email}</a></dd></div>
              {e.phone && <div><dt>Phone</dt><dd><a href={`tel:${e.phone.replace(/\s/g, '')}`}>{e.phone}</a></dd></div>}
              <div><dt>Location</dt><dd>{e.location}</dd></div>
            </dl>
          </section>

          <section className="panel" aria-labelledby="enq-proj">
            <h2 id="enq-proj">Project</h2>
            <dl className="kv">
              <div><dt>Type</dt><dd>{e.projectType}</dd></div>
              <div><dt>Budget</dt><dd>{e.budgetRange}</dd></div>
              <div><dt>Timeline</dt><dd>{e.timeline}</dd></div>
              {e.sourceProject && <div><dt>Came from project</dt><dd>{e.sourceProject}</dd></div>}
              {e.sourceService && <div><dt>Came from service</dt><dd>{e.sourceService}</dd></div>}
              <div><dt>Privacy consent</dt><dd>{e.consent ? 'Given' : 'Not recorded'}</dd></div>
            </dl>
          </section>

          <section className="panel" aria-labelledby="enq-mail">
            <h2 id="enq-mail">Notification email</h2>
            <p><Badge kind={e.emailStatus === 'sent' ? 'qualified' : e.emailStatus === 'failed' ? 'failed' : 'closed'}>{e.emailStatus}</Badge> {e.emailLastAttemptAt && <span className="small muted">Last attempt {when(e.emailLastAttemptAt)}</span>}</p>
            {e.emailStatus !== 'sent' && <button type="button" className="btn btn-outline btn-sm" onClick={retry} disabled={busy}>Retry email</button>}
          </section>
        </aside>
      </div>
    </div>
  );
}

export { formatDate };
