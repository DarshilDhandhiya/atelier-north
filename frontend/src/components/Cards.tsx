import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTilt } from '../lib/fx';
import { formatDate } from '../lib/format';
import type { Article, Project } from '../lib/types';
import { Frame } from './Img';

export function ProjectCard({ project, ratio = 4 / 3, sizes = '(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw', priority = false }: { project: Project; ratio?: number; sizes?: string; priority?: boolean }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useTilt(ref, 6);
  return (
    <Link ref={ref} to={`/projects/${project.slug}`} className="card card--tilt">
      <Frame image={project.coverImage} ratio={ratio} sizes={sizes} priority={priority} />
      <span className="card-cursor" aria-hidden="true">View</span>
      <h3 className="card-title">{project.title}</h3>
      <p className="card-meta">
        {project.category}, {project.location}, {project.year}
      </p>
    </Link>
  );
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link to={`/journal/${article.slug}`} className="card card--lift">
      <Frame image={article.coverImage} ratio={3 / 2} sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw" />
      <p className="card-meta" style={{ marginTop: 'var(--s-4)' }}>
        {article.category}, {article.readingTime} min read
      </p>
      <h3 className="card-title" style={{ marginTop: 'var(--s-2)' }}>{article.title}</h3>
      <p className="card-summary">{article.excerpt}</p>
      <p className="card-meta">
        {article.author}, <time dateTime={article.publishedAt ?? undefined}>{formatDate(article.publishedAt)}</time>
      </p>
    </Link>
  );
}
