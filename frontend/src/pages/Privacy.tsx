import { Link } from 'react-router-dom';
import { analyticsEnabled, openCookieSettings } from '../lib/consent';
import { useSeo } from '../lib/seo';
import { useSite } from '../lib/site';

export default function Privacy() {
  useSeo({ title: 'Privacy notice', description: 'How Atelier North collects, uses and protects the information you share when you contact the studio.', path: '/privacy' });
  const { settings } = useSite();
  const email = settings?.contact.email ?? 'hello@atelier-north.example';
  return (
    <div className="container">
      <header className="page-head">
        <h1>Privacy notice</h1>
        <p className="lead">Plain-language summary of what we do with the information you send us.</p>
      </header>
      <div className="legal prose" style={{ paddingBottom: 'var(--section)' }}>
        <p className="alert alert-info"><strong>Demo notice:</strong> this notice is a template for a demonstration site. Have it reviewed by a qualified adviser before using it for a real studio.</p>

        <h2>Who we are</h2>
        <p>{settings?.brand.name ?? 'Atelier North'} is the controller of the information collected through this website. You can reach us at <a href={`mailto:${email}`}>{email}</a>.</p>

        <h2>What we collect</h2>
        <ul>
          <li><strong>Enquiry form:</strong> your name, email, optional phone number, project type, location, budget range, timeline, message and an optional attachment.</li>
          <li><strong>Spam protection:</strong> a one-way hash of your IP address and your browser type, so we can spot abuse. We cannot reverse the hash.</li>
          <li><strong>Staff sign-in:</strong> staff accounts use a session cookie. Visitors do not receive any cookies from us.</li>
        </ul>

        <h2>Why we use it</h2>
        <p>We use it to reply to your enquiry and to prepare for a first conversation. We rely on your consent, which you give by ticking the box on the form. You can withdraw it at any time.</p>

        <h2>Who sees it</h2>
        <p>Only studio staff with an account can read enquiries. Our email provider processes notifications on our behalf. We do not sell or share your information for marketing.</p>

        <h2>How long we keep it</h2>
        <p>We keep enquiries for 24 months after our last contact with you, then delete them. Attachments are deleted with the enquiry.</p>

        <h2>Your rights</h2>
        <p>You may ask to see, correct, export or delete your information at any time by emailing us. You may also complain to your local data protection authority.</p>

        <h2>Cookies and analytics</h2>
        {analyticsEnabled ? (
          <>
            <p>This site can use Plausible, a privacy-friendly analytics service that does not use cookies or track you across sites. It only loads if you choose to allow it, and you can change your mind at any time.</p>
            <p><button type="button" className="btn btn-outline btn-sm" onClick={openCookieSettings}>Change cookie settings</button></p>
          </>
        ) : (
          <p>This site does not use analytics or advertising cookies. We store nothing on your device except what is needed to show the page.</p>
        )}
        <p><Link to="/contact">Contact the studio</Link> if you have any questions.</p>
      </div>
    </div>
  );
}
