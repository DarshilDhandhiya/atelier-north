import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';

export default function NotFound({ what = 'page' }: { what?: string }) {
  useSeo({ title: 'Page not found', noindex: true });
  return (
    <div className="container notfound">
      <p className="display" aria-hidden="true">404</p>
      <h1 style={{ fontSize: 'var(--h2)' }}>We could not find that {what}.</h1>
      <p className="lead">It may have moved, been unpublished, or the link may have a typo. These pages might help.</p>
      <div className="row">
        <Link to="/" className="btn">Go to the home page</Link>
        <Link to="/projects" className="btn btn-outline">Browse projects</Link>
        <Link to="/contact" className="btn btn-outline">Contact the studio</Link>
      </div>
    </div>
  );
}
