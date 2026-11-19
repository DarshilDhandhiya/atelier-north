import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArticleCard } from '../components/Cards';
import { Frame } from '../components/Img';
import { Pagination } from '../components/Pagination';
import { CardSkeletons, EmptyState, ErrorState, PageSkeleton } from '../components/States';
import { qs, useApi, useDebounced } from '../lib/api';
import { formatDate } from '../lib/format';
import { sizedUrl } from '../lib/images';
import { siteOrigin, useSeo } from '../lib/seo';
import type { Article, Paged } from '../lib/types';
import NotFound from './NotFound';

export function Journal() {
  useSeo({ title: 'Journal', description: 'Notes on process, materials and renovation from the architects and designers at Atelier North.', path: '/journal' });
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? '';
  const q = params.get('q') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);
  const [search, setSearch] = useState(q);
  const debounced = useDebounced(search, 350);
  useEffect(() => setSearch(q), [q]);
  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete('page');
    setParams(next, { replace: true });
  };
  useEffect(() => {
    if (debounced !== q) update({ q: debounced.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const cats = useApi<{ data: string[] }>('/api/articles/categories');
  const list = useApi<Paged<Article>>(`/api/articles${qs({ category, q, page, limit: 9 })}`);

  return (
    <div className="container">
      <header className="page-head">
        <h1>Journal</h1>
        <p className="lead">Notes on how we think about process, materials and old buildings.</p>
      </header>
      <div className="filters" role="search" aria-label="Filter articles">
        <div className="chips" role="group" aria-label="Category">
          <button type="button" className="chip" aria-pressed={!category} onClick={() => update({ category: '' })}>All</button>
          {cats.data?.data.map((c) => <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => update({ category: category === c ? '' : c })}>{c}</button>)}
        </div>
        <div className="field" style={{ maxWidth: 420 }}>
          <label htmlFor="jq">Search articles</label>
          <input id="jq" className="input" type="search" value={search} onChange={(e) => setSearch(e.target.value)} autoComplete="off" />
        </div>
      </div>
      <div style={{ paddingBottom: 'var(--section)' }}>
        {list.loading && <CardSkeletons count={3} ratio="3 / 2" />}
        {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
        {list.data && list.data.data.length === 0 && (
          <EmptyState title="No articles found" action={<button type="button" className="btn" onClick={() => { setSearch(''); setParams({}, { replace: true }); }}>Clear filters</button>}>
            Try another category or a broader search.
          </EmptyState>
        )}
        {list.data && list.data.data.length > 0 && (
          <>
            <div className="article-grid">{list.data.data.map((a) => <ArticleCard key={a.id} article={a} />)}</div>
            <Pagination page={list.data.meta.page} totalPages={list.data.meta.totalPages} />
          </>
        )}
      </div>
    </div>
  );
}

export function ArticleDetail() {
  const { slug } = useParams();
  const { data, error, loading, reload } = useApi<{ data: Article; related: Article[] }>(`/api/articles/${slug}`);
  const a = data?.data;
  useSeo({
    title: a?.seo?.title || a?.title,
    description: a?.seo?.description || a?.excerpt,
    image: a?.seo?.ogImage || a?.coverImage.url,
    path: `/journal/${slug}`,
    type: 'article',
    noindex: !a && !loading,
    jsonLd: a
      ? {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: a.title,
          description: a.excerpt,
          image: sizedUrl(a.coverImage.url, 1200, 800),
          datePublished: a.publishedAt,
          author: { '@type': 'Person', name: a.author },
          mainEntityOfPage: `${siteOrigin()}/journal/${a.slug}`,
        }
      : undefined,
  });
  if (loading) return <PageSkeleton />;
  if (error?.status === 404) return <NotFound what="article" />;
  if (error || !a) return <div className="container"><ErrorState error={error} onRetry={reload} /></div>;

  return (
    <article>
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb" style={{ paddingTop: 'var(--s-5)' }}>
          <ol><li><Link to="/">Home</Link></li><li><Link to="/journal">Journal</Link></li><li aria-current="page">{a.category}</li></ol>
        </nav>
        <header className="article-head">
          <p className="label">{a.category}</p>
          <h1>{a.title}</h1>
          <p className="lead">{a.excerpt}</p>
          <p className="small muted">
            By {a.author} · <time dateTime={a.publishedAt ?? undefined}>{formatDate(a.publishedAt)}</time> · {a.readingTime} min read
          </p>
        </header>
        <Frame image={a.coverImage} ratio={16 / 9} priority sizes="(min-width:1440px) 1360px, 100vw" widths={[640, 1080, 1600]} />
        <div className="article-body prose" dangerouslySetInnerHTML={{ __html: a.body ?? '' }} />
      </div>
      {data.related.length > 0 && (
        <section className="section section-alt" aria-labelledby="rel-h">
          <div className="container">
            <h2 id="rel-h" style={{ marginBottom: 'var(--s-7)' }}>Keep reading</h2>
            <div className="article-grid">{data.related.map((r) => <ArticleCard key={r.id} article={r} />)}</div>
          </div>
        </section>
      )}
    </article>
  );
}
