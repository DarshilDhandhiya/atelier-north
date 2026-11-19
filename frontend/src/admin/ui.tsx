import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ApiError } from '../lib/api';

/* ---------- toasts ---------- */
type ToastKind = 'ok' | 'error';
interface Toast {
  id: number;
  text: string;
  kind: ToastKind;
}
interface ConfirmOpts {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}
interface UiCtx {
  toast: (text: string, kind?: ToastKind) => void;
  confirm: (o: ConfirmOpts) => Promise<boolean>;
}
const Ctx = createContext<UiCtx>(null as unknown as UiCtx);
export const useUi = () => useContext(Ctx);

export function UiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const id = useRef(0);

  const toast = useCallback((text: string, kind: ToastKind = 'ok') => {
    const n = ++id.current;
    setToasts((t) => [...t, { id: n, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== n)), kind === 'error' ? 7000 : 3500);
  }, []);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setDlg({ ...o, resolve })), []);
  const close = (v: boolean) => {
    dlg?.resolve(v);
    setDlg(null);
  };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind === 'error' ? 'toast-error' : ''}`}>{t.text}</div>
        ))}
      </div>
      {dlg && <ConfirmDialog {...dlg} onClose={close} />}
    </Ctx.Provider>
  );
}

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, onClose }: ConfirmOpts & { onClose: (v: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose(false)}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-d">
        <h2 id="dlg-t">{title}</h2>
        <p id="dlg-d">{message}</p>
        <div className="row" style={{ marginTop: 'var(--s-5)', justifyContent: 'flex-end' }}>
          <button ref={cancelRef} type="button" className="btn btn-outline" onClick={() => onClose(false)}>Cancel</button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : ''}`} onClick={() => onClose(true)}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
export const Badge = ({ kind, children }: { kind: string; children?: ReactNode }) => <span className={`badge badge-${kind}`}>{children ?? kind}</span>;

export function ErrorSummary({ error, items }: { error?: ApiError | string | null; items?: { path: string; message: string }[] }) {
  if (!error && !items?.length) return null;
  return (
    <div className="alert alert-error" role="alert" tabIndex={-1} style={{ marginBottom: 'var(--s-5)' }}>
      <h2>{typeof error === 'string' ? error : error?.message ?? 'Some fields need your attention.'}</h2>
      {!!items?.length && (
        <ul>
          {items.map((d) => (
            <li key={d.path + d.message}>
              <a href={`#fld-${d.path.replace(/\./g, '-')}`} onClick={(e) => { e.preventDefault(); document.getElementById(`fld-${d.path.replace(/\./g, '-')}`)?.focus(); }}>
                {d.path.replace(/\./g, ' › ')}
              </a>
              : {d.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function errorMap(err: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (err instanceof ApiError) err.details?.forEach((d) => (out[d.path] = out[d.path] ?? d.message));
  return out;
}
