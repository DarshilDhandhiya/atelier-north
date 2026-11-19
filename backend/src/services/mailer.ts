import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config';
import { Enquiry, getSettings } from '../models';
import { htmlEscape } from '../utils/text';

let transport: Transporter | null = null;

export const mailConfigured = () => Boolean(config.SMTP_HOST) || transport !== null;

/** Tests inject a fake transport; production builds one from SMTP_* variables. */
export function setTransport(t: Transporter | null) {
  transport = t;
}

function getTransport(): Transporter {
  if (transport) return transport;
  transport = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return transport;
}

function backoffMinutes(attempt: number) {
  return config.EMAIL_RETRY_INTERVAL_MIN * Math.pow(2, Math.max(0, attempt - 1));
}

/** Send the staff notification and record the outcome on the enquiry. Never throws. */
export async function notifyStaff(enquiryId: string): Promise<'sent' | 'failed' | 'skipped'> {
  const enq = await Enquiry.findById(enquiryId);
  if (!enq) return 'failed';

  if (!mailConfigured()) {
    enq.emailStatus = 'skipped';
    enq.emailError = 'SMTP is not configured (set SMTP_HOST). The enquiry is saved and visible in the admin.';
    await enq.save();
    console.warn(`[mail] SMTP not configured – enquiry ${enq.reference} saved without notification.`);
    return 'skipped';
  }

  const settings = await getSettings();
  const to = settings.notificationEmail || config.STAFF_NOTIFY_EMAIL;
  const e = htmlEscape;
  const adminLink = `${config.siteUrl}/admin/enquiries/${enq.id}`;
  const rows: [string, string][] = [
    ['Reference', enq.reference],
    ['Name', enq.name],
    ['Email', enq.email],
    ['Phone', enq.phone || '—'],
    ['Project type', enq.projectType],
    ['Location', enq.location],
    ['Budget', enq.budgetRange],
    ['Timeline', enq.timeline],
    ['Attachment', enq.attachment?.originalName || 'None'],
  ];
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;color:#1b2224">
    <h2 style="margin:0 0 12px">New project enquiry – ${e(enq.reference)}</h2>
    <table style="border-collapse:collapse;width:100%">${rows
      .map(([k, v]) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #dde2dc;color:#5a6668;width:140px">${e(k)}</td><td style="padding:6px 10px;border-bottom:1px solid #dde2dc">${e(v)}</td></tr>`)
      .join('')}</table>
    <h3 style="margin:18px 0 6px">Message</h3>
    <p style="white-space:pre-wrap;margin:0">${e(enq.message)}</p>
    <p style="margin-top:20px"><a href="${e(adminLink)}">Open in the admin</a></p></div>`;
  const textBody = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nMessage:\n${enq.message}\n\nOpen: ${adminLink}`;

  enq.emailAttempts += 1;
  enq.emailLastAttemptAt = new Date();
  try {
    await getTransport().sendMail({
      from: config.MAIL_FROM,
      to,
      replyTo: `${enq.name.replace(/[<>"]/g, '')} <${enq.email}>`,
      subject: `New enquiry ${enq.reference} – ${enq.projectType} (${enq.location})`,
      text: textBody,
      html,
    });
    if (config.SEND_CUSTOMER_ACK) {
      await getTransport().sendMail({
        from: config.MAIL_FROM,
        to: enq.email,
        subject: `We received your enquiry (${enq.reference})`,
        text: `Hello ${enq.name},\n\nThank you for contacting Atelier North. Your reference is ${enq.reference}. A member of the studio will reply within two working days.\n\nAtelier North`,
      }).catch((err) => console.warn('[mail] customer acknowledgement failed:', err.message));
    }
    enq.emailStatus = 'sent';
    enq.emailError = undefined;
    enq.emailNextRetryAt = undefined;
    await enq.save();
    return 'sent';
  } catch (err: any) {
    enq.emailStatus = 'failed';
    enq.emailError = String(err?.message || err).slice(0, 500);
    enq.emailNextRetryAt = enq.emailAttempts >= config.EMAIL_MAX_ATTEMPTS ? undefined : new Date(Date.now() + backoffMinutes(enq.emailAttempts) * 60_000);
    await enq.save();
    console.error(`[mail] notification for ${enq.reference} failed (attempt ${enq.emailAttempts}): ${enq.emailError}`);
    return 'failed';
  }
}

/** Retry failed notifications whose back-off has elapsed. */
export async function retryFailedEmails(): Promise<number> {
  const due = await Enquiry.find({ emailStatus: 'failed', emailNextRetryAt: { $ne: null, $lte: new Date() } }).limit(20);
  for (const enq of due) await notifyStaff(enq.id);
  return due.length;
}

export function startEmailRetryJob() {
  const timer = setInterval(() => {
    retryFailedEmails().catch((e) => console.error('[mail] retry job error', e));
  }, Math.max(1, config.EMAIL_RETRY_INTERVAL_MIN) * 60_000);
  timer.unref();
  return timer;
}
