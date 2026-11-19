import { useState, type FormEvent } from 'react';
import { ApiError, api, useApi } from '../lib/api';
import type { AdminUser } from '../lib/types';
import { ErrorState, PageSkeleton } from '../components/States';
import { useAuth } from './auth';
import { Badge, ErrorSummary, errorMap, useUi } from './ui';

interface Draft {
  id?: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'editor';
  status: 'active' | 'disabled';
}
const blank: Draft = { name: '', email: '', password: '', role: 'editor', status: 'active' };

export function UsersPage() {
  const { user: me } = useAuth();
  const { toast, confirm } = useUi();
  const { data, error, loading, reload } = useApi<{ data: AdminUser[] }>('/api/admin/users');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  const open = (d: Draft) => {
    setDraft(d);
    setErrors({});
    setSummary(null);
    requestAnimationFrame(() => document.getElementById('u-name')?.focus());
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setErrors({});
    setSummary(null);
    try {
      const body: Record<string, unknown> = { name: draft.name, email: draft.email, role: draft.role, status: draft.status };
      if (draft.password) body.password = draft.password;
      if (draft.id) await api.patch(`/api/admin/users/${draft.id}`, body);
      else await api.post('/api/admin/users', { ...body, password: draft.password });
      toast(draft.id ? 'User updated' : 'User created');
      setDraft(null);
      reload();
    } catch (err) {
      setErrors(errorMap(err));
      setSummary(err as ApiError);
    } finally {
      setSaving(false);
    }
  };
  const remove = async (u: AdminUser) => {
    if (!(await confirm({ title: 'Delete this user?', message: `${u.name} (${u.email}) will lose access immediately.`, confirmLabel: 'Delete user', danger: true }))) return;
    try {
      await api.del(`/api/admin/users/${u.id}`);
      toast('User deleted');
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const err = (k: string) => (errors[k] ? <p id={`u-${k}-e`} className="field-error">{errors[k]}</p> : null);
  const d = draft;
  return (
    <div>
      <div className="admin-head">
        <div><h1>Users</h1><p className="muted">Admins manage everything. Editors can change content and media but cannot see enquiries, users or settings.</p></div>
        <button type="button" className="btn" onClick={() => open(blank)}>Add user</button>
      </div>

      {d && (
        <form className="panel" onSubmit={save} noValidate aria-label={d.id ? 'Edit user' : 'New user'} style={{ marginBottom: 'var(--s-6)' }}>
          <h2>{d.id ? 'Edit user' : 'New user'}</h2>
          <ErrorSummary error={summary && !summary.details?.length ? summary : null} items={summary?.details} />
          <div className="form-grid form-grid--2">
            <div className="field"><label htmlFor="u-name">Name</label><input id="u-name" className="input" value={d.name} onChange={(e) => setDraft({ ...d, name: e.target.value })} aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? 'u-name-e' : undefined} />{err('name')}</div>
            <div className="field"><label htmlFor="u-email">Email</label><input id="u-email" className="input" type="email" value={d.email} onChange={(e) => setDraft({ ...d, email: e.target.value })} aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? 'u-email-e' : undefined} />{err('email')}</div>
            <div className="field">
              <label htmlFor="u-password">{d.id ? 'New password' : 'Password'}{d.id && <span className="optional"> (leave blank to keep the current one)</span>}</label>
              <input id="u-password" className="input" type="password" autoComplete="new-password" value={d.password} onChange={(e) => setDraft({ ...d, password: e.target.value })} aria-invalid={errors.password ? true : undefined} aria-describedby={errors.password ? 'u-password-e' : 'u-password-h'} />
              <p id="u-password-h" className="hint">At least 10 characters, with a letter and a number.</p>{err('password')}
            </div>
            <div className="field"><label htmlFor="u-role">Role</label><select id="u-role" className="select" value={d.role} onChange={(e) => setDraft({ ...d, role: e.target.value as Draft['role'] })}><option value="editor">Editor</option><option value="admin">Admin</option></select></div>
            <div className="field"><label htmlFor="u-status">Status</label><select id="u-status" className="select" value={d.status} onChange={(e) => setDraft({ ...d, status: e.target.value as Draft['status'] })}><option value="active">Active</option><option value="disabled">Disabled</option></select></div>
          </div>
          <div className="row" style={{ marginTop: 'var(--s-4)' }}>
            <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : d.id ? 'Save user' : 'Create user'}</button>
            <button className="btn btn-outline" type="button" onClick={() => setDraft(null)}>Cancel</button>
          </div>
        </form>
      )}

      {loading && !data && <PageSkeleton />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Users</caption>
            <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Last sign-in</th><th scope="col">Actions</th></tr></thead>
            <tbody>
              {data.data.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}{u.id === me?.id && <span className="small muted"> (you)</span>}</td>
                  <td>{u.email}</td>
                  <td><Badge kind={u.role === 'admin' ? 'qualified' : 'contacted'}>{u.role}</Badge></td>
                  <td>{u.status === 'active' ? <Badge kind="qualified">active</Badge> : <Badge kind="closed">disabled</Badge>}</td>
                  <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never'}</td>
                  <td>
                    <div className="row" style={{ gap: 'var(--s-2)' }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => open({ id: u.id, name: u.name, email: u.email, password: '', role: u.role, status: u.status })}>Edit<span className="sr-only"> {u.name}</span></button>
                      {u.id !== me?.id && <button type="button" className="btn btn-outline btn-sm" onClick={() => remove(u)}>Delete<span className="sr-only"> {u.name}</span></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
