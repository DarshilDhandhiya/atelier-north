import type { ReactNode } from 'react';
import { ApiError } from '../lib/api';

export function CardSkeletons({ count = 6, ratio = '4 / 3' }: { count?: number; ratio?: string }) {
  return (
    <div className="project-grid" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} aria-hidden="true">
          <div className="skeleton" style={{ aspectRatio: ratio }} />
          <div className="skeleton skeleton-line" style={{ width: '70%', height: '1.6rem', marginTop: '1rem' }} />
          <div className="skeleton skeleton-line" style={{ width: '45%' }} />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container section" role="status" aria-label="Loading page">
      <div className="skeleton" style={{ height: '3.5rem', width: 'min(520px, 80%)' }} aria-hidden="true" />
      <div className="skeleton skeleton-line" style={{ width: 'min(380px, 60%)' }} aria-hidden="true" />
      <div className="skeleton" style={{ aspectRatio: '16 / 8', marginTop: '2rem' }} aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="state">
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'We could not load this' }: { error: ApiError | Error | null; onRetry?: () => void; title?: string }) {
  return (
    <div className="state" role="alert">
      <h2>{title}</h2>
      <p className="muted">{error?.message ?? 'Something went wrong.'} Try again in a moment.</p>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
