import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ProjectCard } from '../components/Cards';
import { Pagination } from '../components/Pagination';
import { CardSkeletons, EmptyState, ErrorState } from '../components/States';
import { qs, useApi, useDebounced } from '../lib/api';
import { useSeo } from '../lib/seo';
import type { Paged, Project } from '../lib/types';

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'largest', label: 'Largest first' },
  { value: 'smallest', label: 'Smallest first' },
  { value: 'title', label: 'Name A to Z' },
];

export default function Projects() {
  useSeo({ title: 'Projects', description: 'Homes, workplaces and hotels designed by Atelier North. Filter by category or location and explore each case study.', path: '/projects' });
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const location = params.get('location') ?? '';
  const sort = params.get('sort') ?? 'newest';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const [search, setSearch] = useState(q);
  const debounced = useDebounced(search, 350);
  useEffect(() => setSearch(q), [q]);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v && !(k === 'sort' && v === 'newest') ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  };
  useEffect(() => {
    if (debounced !== q) update({ q: debounced.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const filters = useApi<{ data: { categories: string[]; locations: string[] } }>('/api/projects/filters');
  const list = useApi<Paged<Project>>(`/api/projects${qs({ q, category, location, sort, page, limit: 9 })}`);
  const active = Boolean(q || category || location || sort !== 'newest');
  const total = list.data?.meta.total ?? 0;

  return (
    <div className="container">
      <header className="page-head">
        <h1>Projects</h1>
        <p className="lead">Homes, workplaces and hotels, each designed around its site, its climate and the people who use it.</p>
      </header>

      <form className="filters" role="search" aria-label="Filter projects" onSubmit={(e) => e.preventDefault()}>
        <div className="chips" role="group" aria-label="Category">
          <button type="button" className="chip" aria-pressed={!category} onClick={() => update({ category: '' })}>All</button>
          {filters.data?.data.categories.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => update({ category: category === c ? '' : c })}>
              {c}
            </button>
          ))}
        </div>
        <div className="filters-row">
          <div className="field">
            <label htmlFor="q">Search projects</label>
            <input id="q" className="input" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Try “hotel”, “concrete” or “Lisbon”" autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="loc">Location</label>
            <select id="loc" className="select" value={location} onChange={(e) => update({ location: e.target.value })}>
              <option value="">All locations</option>
              {filters.data?.data.locations.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sort">Sort by</label>
            <select id="sort" className="select" value={sort} onChange={(e) => update({ sort: e.target.value })}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <p className="result-count" role="status" aria-live="polite">
            {list.loading ? 'Loading projects…' : list.error ? '' : `${total} ${total === 1 ? 'project' : 'projects'}${active ? ' match your filters' : ''}`}
          </p>
          {active && (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setParams({}, { replace: true }); }}>
              Clear filters
            </button>
          )}
        </div>
      </form>

      <div style={{ paddingBottom: 'var(--section)' }}>
        {list.loading && <CardSkeletons count={6} />}
        {list.error && <ErrorState error={list.error} onRetry={list.reload} title="We could not load the projects" />}
        {list.data && list.data.data.length === 0 && (
          <EmptyState title="No projects match those filters" action={<Link to="/projects" className="btn" onClick={() => setSearch('')}>Show all projects</Link>}>
            Try a different category or location, or search for a broader word.
          </EmptyState>
        )}
        {list.data && list.data.data.length > 0 && (
          <>
            <div className="project-grid">
              {list.data.data.map((p, i) => <ProjectCard key={p.id} project={p} priority={i < 3} />)}
            </div>
            <Pagination page={list.data.meta.page} totalPages={list.data.meta.totalPages} />
          </>
        )}
      </div>
    </div>
  );
}
