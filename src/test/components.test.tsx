import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Contact from '../pages/Contact';
import { Lightbox } from '../components/Lightbox';
import { Pagination } from '../components/Pagination';
import { SiteProvider } from '../lib/site';

const images = [1, 2, 3].map((n) => ({ url: `https://images.pexels.com/photos/${n}/p.jpeg?w=1200&h=800`, alt: `Gallery image ${n}`, width: 1200, height: 800 }));
const settings = { brand: { name: 'Atelier North' }, contact: { email: 'studio@atelier-north.example', address: 'Studio 3, Bergen', phone: '+47 55 00 00 00' }, social: {}, seoDefaults: {}, home: {}, about: {} };

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const body = String(url).includes('/api/settings') ? { data: settings } : { error: { message: 'offline' } };
    return new Response(JSON.stringify(body), { status: String(url).includes('/api/settings') ? 200 : 500 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

const renderContact = () => render(<MemoryRouter><SiteProvider><Contact /></SiteProvider></MemoryRouter>);

describe('Contact form', () => {
  it('has no detectable accessibility violations', async () => {
    const { container } = renderContact();
    await screen.findByText(/studio@atelier-north.example/);
    expect(await axe(container)).toHaveNoViolations();
  });
  it('shows an error summary, marks fields invalid and focuses the summary on empty submit', async () => {
    renderContact();
    await userEvent.click(screen.getByRole('button', { name: /send enquiry/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/please fix 8 problems/i);
    expect(screen.getByLabelText(/your name/i)).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(alert).toHaveFocus());
  });
  it('does not call the API while the form is invalid', async () => {
    renderContact();
    await userEvent.click(screen.getByRole('button', { name: /send enquiry/i }));
    expect((fetch as any).mock.calls.some(([u, o]: any) => String(u).includes('/api/enquiries') && o?.method === 'POST')).toBe(false);
  });
  it('includes a hidden honeypot that is not reachable by keyboard', () => {
    renderContact();
    const hp = screen.getByLabelText(/leave empty/i);
    expect(hp).toHaveAttribute('tabindex', '-1');
    expect(hp.closest('[aria-hidden="true"]')).not.toBeNull();
  });
});

describe('Lightbox', () => {
  it('navigates with arrow keys, wraps around, and closes with Escape', async () => {
    const onClose = vi.fn();
    render(<Lightbox images={images} startIndex={0} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByAltText('Gallery image 1')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(await screen.findByAltText('Gallery image 2')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(await screen.findByAltText('Gallery image 3')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
  it('has no detectable accessibility violations', async () => {
    render(<Lightbox images={images} startIndex={1} onClose={() => undefined} />);
    expect(await axe(screen.getByRole('dialog'))).toHaveNoViolations();
  });
});

describe('Pagination', () => {
  it('renders real links, marks the current page and hides itself for one page', () => {
    const { rerender, container } = render(<MemoryRouter initialEntries={['/projects?category=Residential&page=2']}><Pagination page={2} totalPages={5} /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /page 3/i })).toHaveAttribute('href', '/projects?category=Residential&page=3');
    expect(screen.getByRole('link', { name: /page 2/i })).toHaveAttribute('aria-current', 'page');
    rerender(<MemoryRouter><Pagination page={1} totalPages={1} /></MemoryRouter>);
    expect(container).toBeEmptyDOMElement();
  });
});
