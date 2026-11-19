import { formatDate } from '../lib/format';
import type { FieldSpec } from './fields';
import { Badge } from './ui';
import type { ResourceConfig } from './ResourceManager';

const blankImage = () => ({ url: '', alt: '' });
const seoFields: FieldSpec[] = [
  { type: 'section', title: 'Search and sharing' },
  { type: 'text', name: 'seo.title', label: 'Search title', hint: 'Optional. Shown in Google and browser tabs. Falls back to the page title.' },
  { type: 'textarea', name: 'seo.description', label: 'Search description', rows: 3, hint: 'Optional. Around 150 characters works best.' },
];

export const projectsCfg: ResourceConfig = {
  key: 'projects',
  singular: 'Project',
  plural: 'Projects',
  intro: 'Case studies shown on the Projects page. Featured projects also appear on the home page.',
  titleField: 'title',
  publish: 'date',
  featuredOrdering: true,
  publicPath: (r) => (r.slug ? `/projects/${r.slug}` : null),
  columns: [
    { header: 'Title', render: (r) => r.title },
    { header: 'Category', render: (r) => r.category },
    { header: 'Location', render: (r) => r.location },
    { header: 'Year', render: (r) => r.year },
    { header: 'Featured', render: (r) => (r.featured ? <Badge kind="contacted">featured</Badge> : <span className="muted">No</span>) },
  ],
  blank: () => ({ title: '', slug: '', category: '', location: '', year: new Date().getFullYear(), areaSqFt: 0, summary: '', brief: '', approach: '', scope: [], coverImage: blankImage(), gallery: [], tags: [], featured: false, featuredOrder: 0, publishedAt: null, demo: false, seo: { title: '', description: '' } }),
  fields: [
    { type: 'section', title: 'Basics' },
    { type: 'text', name: 'title', label: 'Title' },
    { type: 'text', name: 'slug', label: 'URL slug', hint: 'Leave blank to create it from the title. Lowercase letters, numbers and hyphens.', half: true },
    { type: 'text', name: 'category', label: 'Category', hint: 'For example Residential, Hospitality, Workplace.', half: true },
    { type: 'text', name: 'location', label: 'Location', half: true },
    { type: 'number', name: 'year', label: 'Year', half: true },
    { type: 'number', name: 'areaSqFt', label: 'Area (sq ft)', half: true },
    { type: 'textarea', name: 'summary', label: 'Summary', rows: 3, hint: 'One or two sentences shown on cards.' },
    { type: 'section', title: 'Story' },
    { type: 'textarea', name: 'brief', label: 'Brief', rows: 6, hint: 'What the client asked for. Separate paragraphs with a blank line.' },
    { type: 'textarea', name: 'approach', label: 'Approach', rows: 6, hint: 'How the studio responded.' },
    { type: 'strings', name: 'scope', label: 'Scope of work', placeholder: 'For example Full architectural design' },
    { type: 'strings', name: 'tags', label: 'Tags' },
    { type: 'section', title: 'Images' },
    { type: 'image', name: 'coverImage', label: 'Cover image' },
    { type: 'images', name: 'gallery', label: 'Gallery', hint: 'Shown in the project gallery and lightbox, in this order.' },
    { type: 'section', title: 'Publishing' },
    { type: 'date', name: 'publishedAt', label: 'Publish date', hint: 'Leave empty to keep as a draft. A future date schedules it.' },
    { type: 'checkbox', name: 'featured', label: 'Feature on the home page', hint: 'Use “Featured projects” on the list page to set the order.' },
    { type: 'checkbox', name: 'demo', label: 'Demo content', hint: 'Marks placeholder projects. Untick once you replace them with real work.' },
    ...seoFields,
  ],
};

export const servicesCfg: ResourceConfig = {
  key: 'services',
  singular: 'Service',
  plural: 'Services',
  intro: 'The studio’s services. Order here is the order on the site.',
  titleField: 'title',
  publish: 'flag',
  orderable: true,
  publicPath: (r) => (r.slug ? `/services/${r.slug}` : null),
  columns: [
    { header: 'Title', render: (r) => r.title },
    { header: 'Summary', render: (r) => <span className="clamp">{r.summary}</span> },
  ],
  blank: () => ({ title: '', slug: '', summary: '', description: '', deliverables: [], steps: [], faq: [], heroImage: null, order: 0, published: false }),
  fields: [
    { type: 'text', name: 'title', label: 'Title' },
    { type: 'text', name: 'slug', label: 'URL slug', hint: 'Leave blank to create it from the title.', half: true },
    { type: 'number', name: 'order', label: 'Order', half: true },
    { type: 'textarea', name: 'summary', label: 'Summary', rows: 3 },
    { type: 'richtext', name: 'description', label: 'Description' },
    { type: 'strings', name: 'deliverables', label: 'Deliverables' },
    { type: 'objects', name: 'steps', label: 'How we work together', itemLabel: 'Step', blank: { title: '', description: '' }, fields: [{ type: 'text', name: 'title', label: 'Step title' }, { type: 'textarea', name: 'description', label: 'Step description', rows: 3 }] },
    { type: 'objects', name: 'faq', label: 'Frequently asked questions', itemLabel: 'Question', blank: { question: '', answer: '' }, fields: [{ type: 'text', name: 'question', label: 'Question' }, { type: 'textarea', name: 'answer', label: 'Answer', rows: 3 }] },
    { type: 'image', name: 'heroImage', label: 'Hero image', optional: true },
    { type: 'checkbox', name: 'published', label: 'Published', hint: 'Unpublished services are hidden from the site.' },
  ],
};

export const articlesCfg: ResourceConfig = {
  key: 'articles',
  singular: 'Article',
  plural: 'Journal articles',
  intro: 'Journal posts. Reading time is calculated automatically.',
  titleField: 'title',
  publish: 'date',
  publicPath: (r) => (r.slug ? `/journal/${r.slug}` : null),
  columns: [
    { header: 'Title', render: (r) => r.title },
    { header: 'Category', render: (r) => r.category },
    { header: 'Author', render: (r) => r.author },
    { header: 'Published', render: (r) => (r.publishedAt ? formatDate(r.publishedAt) : '—') },
  ],
  blank: () => ({ title: '', slug: '', excerpt: '', body: '', coverImage: blankImage(), category: '', author: '', tags: [], publishedAt: null, seo: { title: '', description: '' } }),
  fields: [
    { type: 'text', name: 'title', label: 'Title' },
    { type: 'text', name: 'slug', label: 'URL slug', hint: 'Leave blank to create it from the title.', half: true },
    { type: 'text', name: 'category', label: 'Category', half: true },
    { type: 'text', name: 'author', label: 'Author', half: true },
    { type: 'date', name: 'publishedAt', label: 'Publish date', hint: 'Leave empty to keep as a draft.' },
    { type: 'textarea', name: 'excerpt', label: 'Excerpt', rows: 3, hint: 'Shown on the journal list and in search results.' },
    { type: 'richtext', name: 'body', label: 'Article body' },
    { type: 'image', name: 'coverImage', label: 'Cover image' },
    { type: 'strings', name: 'tags', label: 'Tags' },
    ...seoFields,
  ],
};

export const testimonialsCfg: ResourceConfig = {
  key: 'testimonials',
  singular: 'Testimonial',
  plural: 'Testimonials',
  intro: 'Client quotes. Only approved testimonials appear on the site.',
  titleField: 'name',
  publish: 'none',
  orderable: true,
  columns: [
    { header: 'Name', render: (r) => r.name },
    { header: 'Role', render: (r) => r.role || '—' },
    { header: 'Quote', render: (r) => <span className="clamp">{r.quote}</span> },
    { header: 'Approved', render: (r) => (r.approved ? <Badge kind="qualified">approved</Badge> : <Badge kind="closed">hidden</Badge>) },
  ],
  blank: () => ({ name: '', role: '', quote: '', projectId: null, approved: true, order: 0 }),
  fields: [
    { type: 'text', name: 'name', label: 'Client name', half: true },
    { type: 'text', name: 'role', label: 'Role or project', half: true },
    { type: 'textarea', name: 'quote', label: 'Quote', rows: 5 },
    { type: 'projectSelect', name: 'projectId', label: 'Linked project' },
    { type: 'number', name: 'order', label: 'Order', half: true },
    { type: 'checkbox', name: 'approved', label: 'Approved for display on the site' },
  ],
};

export const teamCfg: ResourceConfig = {
  key: 'team',
  singular: 'Team member',
  plural: 'Team',
  intro: 'People shown on the About page.',
  titleField: 'name',
  publish: 'flag',
  orderable: true,
  columns: [
    { header: 'Name', render: (r) => r.name },
    { header: 'Role', render: (r) => r.role },
  ],
  blank: () => ({ name: '', role: '', bio: '', photo: null, credentials: [], order: 0, published: true }),
  fields: [
    { type: 'text', name: 'name', label: 'Name', half: true },
    { type: 'text', name: 'role', label: 'Role', half: true },
    { type: 'textarea', name: 'bio', label: 'Bio', rows: 5 },
    { type: 'image', name: 'photo', label: 'Photo', optional: true },
    { type: 'strings', name: 'credentials', label: 'Credentials' },
    { type: 'number', name: 'order', label: 'Order', half: true },
    { type: 'checkbox', name: 'published', label: 'Show on the About page' },
  ],
};

export const RESOURCES = [projectsCfg, servicesCfg, articlesCfg, testimonialsCfg, teamCfg];
