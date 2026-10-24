import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { addToCleanupQueue, markCleanupCompleted } from './db';

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const LOCAL_TEMP_DIR = path.join(process.cwd(), 'public', 'uploads', 'temp');

function ensureLocalTempDir(): void {
  if (!fs.existsSync(LOCAL_TEMP_DIR)) {
    fs.mkdirSync(LOCAL_TEMP_DIR, { recursive: true });
  }
}

export interface UploadResult {
  url: string;
  publicId: string;
  storageProvider: 'cloudinary' | 'local';
}

/**
 * Upload an evidence image buffer to temporary storage.
 */
export async function uploadEvidencePhoto(
  buffer: Buffer,
  mimeType: string,
  filenamePrefix: string = 'evidence'
): Promise<UploadResult> {
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const uniqueId = `${filenamePrefix}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

  if (isCloudinaryConfigured) {
    try {
      const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;
      const uploadRes = await cloudinary.uploader.upload(base64Data, {
        folder: 'cleanbieber/temp',
        public_id: uniqueId,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1280, height: 1280, crop: 'limit', quality: 'auto:eco' }],
      });

      return {
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
        storageProvider: 'cloudinary',
      };
    } catch (err) {
      console.warn('Cloudinary upload failed, falling back to local temporary storage:', err);
    }
  }

  // Development / Local temporary file fallback
  ensureLocalTempDir();
  const filename = `${uniqueId}.${extension}`;
  const filePath = path.join(LOCAL_TEMP_DIR, filename);
  fs.writeFileSync(filePath, buffer);

  return {
    url: `/uploads/temp/${filename}`,
    publicId: filename,
    storageProvider: 'local',
  };
}

/**
 * Delete evidence photo after administrative moderation decision
 */
export async function deleteEvidencePhoto(publicId: string): Promise<boolean> {
  if (!publicId) return true;

  try {
    if (isCloudinaryConfigured && publicId.startsWith('cleanbieber/')) {
      const res = await cloudinary.uploader.destroy(publicId);
      if (res.result === 'ok' || res.result === 'not found') {
        await markCleanupCompleted(publicId);
        return true;
      }
      throw new Error(`Cloudinary destroy returned: ${res.result}`);
    }

    // Local file fallback
    const localPath = path.join(LOCAL_TEMP_DIR, publicId);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    await markCleanupCompleted(publicId);
    return true;
  } catch (error) {
    console.error(`Failed to delete temporary image ${publicId}:`, error);
    // Queue for scheduled cleanup retry
    await addToCleanupQueue(publicId);
    return false;
  }
}
