import { Link, useSearchParams } from 'react-router-dom';

/** Accessible, URL-driven pagination: every page is a real link, so it works with back/forward and sharing. */
export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const [params] = useSearchParams();
  if (totalPages <= 1) return null;

  const to = (p: number) => {
    const next = new URLSearchParams(params);
    if (p <= 1) next.delete('page');
    else next.set('page', String(p));
    const s = next.toString();
    return { search: s ? `?${s}` : '' };
  };

  const pages: (number | 'gap')[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== 'gap') pages.push('gap');
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 ? <Link to={to(page - 1)} rel="prev">Previous</Link> : <span className="page disabled" aria-disabled="true">Previous</span>}
      {pages.map((p, i) =>
        p === 'gap' ? (
          <span key={`g${i}`} className="page" aria-hidden="true">…</span>
        ) : (
          <Link key={p} to={to(p)} aria-label={`Page ${p}`} aria-current={p === page ? 'page' : undefined}>
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? <Link to={to(page + 1)} rel="next">Next</Link> : <span className="page disabled" aria-disabled="true">Next</span>}
    </nav>
  );
}
