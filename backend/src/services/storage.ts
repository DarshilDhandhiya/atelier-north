import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config';

export interface StoredImage {
  url: string;
  key: string;
  driver: 'local' | 'cloudinary';
}

export const uploadDir = path.resolve(process.cwd(), config.UPLOAD_DIR);

/** Public media storage. Local disk by default; Cloudinary when STORAGE_DRIVER=cloudinary. */
export async function saveImage(buffer: Buffer, ext: string, mime: string): Promise<StoredImage> {
  if (config.STORAGE_DRIVER === 'cloudinary') return saveToCloudinary(buffer, mime);
  await fs.mkdir(uploadDir, { recursive: true });
  const key = `${crypto.randomBytes(12).toString('hex')}.${ext}`;
  await fs.writeFile(path.join(uploadDir, key), buffer);
  return { url: `${config.publicApiUrl}/uploads/${key}`, key, driver: 'local' };
}

export async function deleteImage(key: string | undefined, driver: string | undefined) {
  if (!key) return;
  try {
    if (driver === 'cloudinary') await deleteFromCloudinary(key);
    else if (driver === 'local') await fs.unlink(path.join(uploadDir, path.basename(key)));
  } catch {
    /* already gone */
  }
}

/* ---------- Cloudinary (signed upload over REST; no SDK dependency) ---------- */
function cloudinaryCreds() {
  const m = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(config.CLOUDINARY_URL || '');
  if (!m) throw new Error('CLOUDINARY_URL is missing or invalid. Expected cloudinary://API_KEY:API_SECRET@CLOUD_NAME');
  return { apiKey: m[1], apiSecret: m[2], cloud: m[3] };
}
const sign = (params: Record<string, string | number>, secret: string) =>
  crypto
    .createHash('sha1')
    .update(
      Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join('&') + secret,
    )
    .digest('hex');

async function saveToCloudinary(buffer: Buffer, mime: string): Promise<StoredImage> {
  const { apiKey, apiSecret, cloud } = cloudinaryCreds();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'atelier-north';
  const signature = sign({ folder, timestamp }, apiSecret);
  const form = new FormData();
  form.set('file', new Blob([new Uint8Array(buffer)], { type: mime }));
  form.set('api_key', apiKey);
  form.set('timestamp', String(timestamp));
  form.set('folder', folder);
  form.set('signature', signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: form });
  const json: any = await res.json();
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${json?.error?.message || res.status}`);
  return { url: json.secure_url, key: json.public_id, driver: 'cloudinary' };
}

async function deleteFromCloudinary(publicId: string) {
  const { apiKey, apiSecret, cloud } = cloudinaryCreds();
  const timestamp = Math.floor(Date.now() / 1000);
  const body = new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: apiKey, signature: sign({ public_id: publicId, timestamp }, apiSecret) });
  await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, { method: 'POST', body });
}
