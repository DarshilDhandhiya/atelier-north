import { useSeo } from '../lib/seo';

const COLORS: [string, string, string][] = [
  ['Basalt', '#1b2224', 'Text, dark sections'],
  ['Limewash', '#eef1ec', 'Page background'],
  ['Limewash 2', '#e3e8e1', 'Alternate sections'],
  ['Stone', '#cbd1ca', 'Image placeholders'],
  ['Fjord', '#25565c', 'Primary action'],
  ['Fjord 700', '#1a4247', 'Action hover'],
  ['Fjord 100', '#d9e7e5', 'Info tint'],
  ['Birch', '#d9cbb0', 'Quiet accent'],
  ['Danger', '#9b2626', 'Errors'],
  ['Success', '#25603d', 'Confirmations'],
  ['Focus', '#1f6feb', 'Keyboard focus'],
];
const SPACING = [4, 8, 12, 16, 24, 32, 48, 64, 96];

export default function DesignSystem() {
  useSeo({ title: 'Design system', noindex: true, path: '/design-system' });
  return (
    <div className="container" style={{ paddingBottom: 'var(--section)' }}>
      <header className="page-head">
        <h1>Design system</h1>
        <p className="lead">Tokens and components behind this site. Source of truth: <code>src/styles/tokens.css</code>. Documented in <code>docs/DESIGN_SYSTEM.md</code>.</p>
      </header>

      <section className="ds-block" aria-labelledby="ds-color">
        <h2 id="ds-color">Colour</h2>
        <div className="swatches">
          {COLORS.map(([n, hex, use]) => (
            <div className="swatch" key={n}><i style={{ background: hex }} /><span><strong>{n}</strong><br />{hex}<br />{use}</span></div>
          ))}
        </div>
        <p className="small muted">Contrast: Basalt on Limewash 14.6:1 · Fjord on Limewash 7.1:1 · White on Fjord 7.8:1 · Muted text on Limewash 6.9:1. All pass WCAG AA (4.5:1).</p>
      </section>

      <section className="ds-block" aria-labelledby="ds-type">
        <h2 id="ds-type">Typography</h2>
        <p className="muted">Display: Instrument Serif. Text: Hanken Grotesk. Fluid scale; body 17px / 1.6; measure 66ch.</p>
        <p className="display">Display</p>
        <h1 style={{ margin: 0 }}>Heading 1</h1>
        <h2 style={{ margin: 0 }}>Heading 2</h2>
        <h3 style={{ margin: 0 }}>Heading 3</h3>
        <p className="lead">Lead paragraph sets the tone for a page in one or two sentences.</p>
        <p>Body text is set at 17 pixels with generous leading, so long reads stay comfortable on any screen.</p>
        <p className="small muted">Small and muted text for captions and metadata.</p>
      </section>

      <section className="ds-block" aria-labelledby="ds-space">
        <h2 id="ds-space">Spacing and grid</h2>
        <p className="muted">4px base unit. Content width up to 1360px with fluid gutters (20–48px). 12-column grid from 768px. Breakpoints tested at 360, 768, 1024 and 1440.</p>
        <div className="ds-spacing">{SPACING.map((s) => <div key={s} style={{ textAlign: 'center' }}><i style={{ width: s, height: s }} /><span className="small">{s}</span></div>)}</div>
      </section>

      <section className="ds-block" aria-labelledby="ds-btn">
        <h2 id="ds-btn">Buttons and links</h2>
        <div className="row">
          <button className="btn" type="button">Primary</button>
          <button className="btn btn-outline" type="button">Outline</button>
          <button className="btn" type="button" disabled>Disabled</button>
          <button className="btn btn-danger" type="button">Delete</button>
          <button className="btn btn-sm" type="button">Small</button>
          <a className="link-arrow" href="#ds-btn">Text link</a>
        </div>
        <div className="section-dark" style={{ padding: 'var(--s-5)' }}><div className="row"><button className="btn btn-light" type="button">On dark</button><button className="btn btn-ghost-light" type="button">Ghost on dark</button></div></div>
        <div className="chips"><button className="chip" aria-pressed="true" type="button">Selected</button><button className="chip" aria-pressed="false" type="button">Default</button></div>
      </section>

      <section className="ds-block" aria-labelledby="ds-form">
        <h2 id="ds-form">Form fields and states</h2>
        <div className="form-grid form-grid--2">
          <div className="field"><label htmlFor="d1">Default</label><input id="d1" className="input" defaultValue="Value" /></div>
          <div className="field"><label htmlFor="d2">With hint</label><input id="d2" className="input" aria-describedby="d2h" /><p id="d2h" className="hint">Helper text sits under the field.</p></div>
          <div className="field"><label htmlFor="d3">Error</label><input id="d3" className="input" aria-invalid="true" aria-describedby="d3e" defaultValue="name@" /><p id="d3e" className="field-error">Enter a valid email address.</p></div>
          <div className="field"><label htmlFor="d4">Disabled</label><input id="d4" className="input" disabled defaultValue="Not editable" /></div>
          <div className="field"><label htmlFor="d5">Select</label><select id="d5" className="select"><option>Option one</option></select></div>
          <div className="check"><input id="d6" type="checkbox" /><label htmlFor="d6">Checkbox with label</label></div>
        </div>
      </section>

      <section className="ds-block" aria-labelledby="ds-fb">
        <h2 id="ds-fb">Feedback and states</h2>
        <div className="alert alert-success"><h3>Success</h3>Your enquiry is with us. Reference AN-260101-ABCD.</div>
        <div className="alert alert-error"><h3>Error</h3>Name the problem and how to fix it.</div>
        <div className="alert alert-warn"><h3>Warning</h3>Something needs attention but is not blocking.</div>
        <div className="alert alert-info"><h3>Information</h3>Neutral guidance.</div>
        <div className="project-grid"><div><div className="skeleton" style={{ aspectRatio: '4/3' }} /><div className="skeleton skeleton-line" style={{ width: '70%' }} /></div></div>
        <div className="state" style={{ padding: 0 }}><h3>Empty state</h3><p className="muted">Say what is missing and what to do next.</p><button className="btn" type="button">Primary action</button></div>
        <div className="row"><span className="badge badge-new">new</span><span className="badge badge-contacted">contacted</span><span className="badge badge-qualified">qualified</span><span className="badge badge-closed">closed</span><span className="badge badge-failed">failed</span></div>
      </section>

      <section className="ds-block" aria-labelledby="ds-cards">
        <h2 id="ds-cards">Cards and the title block</h2>
        <p className="muted">Cards are image + text with no box or shadow. The title block borrows the corner panel of an architectural drawing sheet for project facts.</p>
        <dl className="title-block">
          <div><dt>Location</dt><dd>Bergen, Norway</dd></div><div><dt>Year</dt><dd>2025</dd></div><div><dt>Area</dt><dd>3,200 sq ft</dd></div><div><dt>Category</dt><dd>Residential</dd></div>
        </dl>
        <div className="accordion"><details open><summary>Accordion item</summary><div className="answer"><p>Built on native details/summary, so it is keyboard accessible by default.</p></div></details></div>
      </section>
    </div>
  );
}
