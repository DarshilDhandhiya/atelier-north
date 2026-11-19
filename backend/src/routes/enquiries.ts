import crypto from 'node:crypto';
import { Router, type Request } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { Attachment, Enquiry } from '../models';
import { enquirySchema } from '../schemas';
import { notifyStaff } from '../services/mailer';
import { ah, badRequest, parse } from '../utils/errors';
import { ATTACHMENT_MIMES, detectFileType, safeFilename } from '../utils/fileType';

const r = Router();

const limiter = rateLimit({
  windowMs: config.ENQUIRY_RATE_LIMIT_WINDOW_MIN * 60_000,
  limit: config.ENQUIRY_RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => config.isTest && process.env.TEST_RATE_LIMIT !== 'on',
  handler: (_req, res) =>
    res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'You have sent several enquiries recently. Please try again later or email us directly.' } }),
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.MAX_ATTACHMENT_MB * 1024 * 1024, files: 1, fields: 20 } });

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function makeReference() {
  const d = new Date();
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  const rand = Array.from(crypto.randomBytes(4), (b) => ALPHABET[b % ALPHABET.length]).join('');
  return `AN-${ymd}-${rand}`;
}

const hashIp = (req: Request) => crypto.createHash('sha256').update(`${req.ip}|${config.JWT_SECRET}`).digest('hex').slice(0, 24);
const countLinks = (s: string) => (s.match(/https?:\/\/|www\./gi) || []).length;

r.post(
  '/',
  limiter,
  upload.single('attachment'),
  ah(async (req, res) => {
    const data: any = parse(enquirySchema, req.body);

    /* ---- spam control ---- */
    // 1. Honeypot: bots fill the hidden field. Pretend success so they do not adapt.
    // 2. Time trap: humans need more than ~2 seconds to fill the form.
    const tooFast = data.formStartedAt && Date.now() - data.formStartedAt < 2000;
    if (data.website || tooFast) {
      console.warn(`[spam] dropped enquiry (${data.website ? 'honeypot' : 'too fast'}) from ${hashIp(req)}`);
      return res.status(201).json({ data: { reference: makeReference(), emailStatus: 'pending' } });
    }
    // 3. Link stuffing
    if (countLinks(data.message) > 2) {
      throw badRequest('Please remove the links from your message — describe the project in your own words instead.', [
        { path: 'message', message: 'Messages can include up to two links.' },
      ]);
    }

    /* ---- attachment: validate by content, never by the filename ---- */
    let detected: ReturnType<typeof detectFileType> = null;
    if (req.file) {
      detected = detectFileType(req.file.buffer);
      if (!detected || !ATTACHMENT_MIMES.includes(detected.mime)) {
        throw badRequest('Attach a JPG, PNG, WebP or PDF file.', [{ path: 'attachment', message: 'Attach a JPG, PNG, WebP or PDF file.' }]);
      }
    }

    /* ---- idempotency: same person + same message within 10 minutes returns the original reference ---- */
    const since = new Date(Date.now() - 10 * 60_000);
    const dup = await Enquiry.findOne({ email: data.email, message: data.message, createdAt: { $gte: since } });
    if (dup) return res.status(200).json({ data: { reference: dup.reference, emailStatus: dup.emailStatus, duplicate: true } });

    let reference = makeReference();
    for (let i = 0; i < 5 && (await Enquiry.exists({ reference })); i++) reference = makeReference();

    const enquiry = await Enquiry.create({
      reference,
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      projectType: data.projectType,
      location: data.location,
      budgetRange: data.budgetRange,
      timeline: data.timeline,
      message: data.message,
      consent: true,
      sourceProject: data.sourceProject,
      sourceService: data.sourceService,
      ipHash: hashIp(req),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 250),
    });

    if (req.file && detected) {
      const att = await Attachment.create({
        enquiryId: enquiry._id,
        filename: safeFilename(req.file.originalname),
        mimeType: detected.mime,
        size: req.file.size,
        data: req.file.buffer,
      });
      enquiry.attachment = { originalName: att.filename, mimeType: att.mimeType, size: att.size, attachmentId: att._id } as any;
      enquiry.attachmentUrl = `/api/admin/enquiries/${enquiry.id}/attachment`; // private, admin-only download
      await enquiry.save();
    }

    // The enquiry is already safe in the database. Notify staff without making the visitor wait.
    const notify = notifyStaff(enquiry.id);
    if (config.isTest) await notify;
    else notify.catch((e) => console.error('[mail] unexpected error', e));

    res.status(201).json({ data: { reference: enquiry.reference } });
  }),
);

export default r;
