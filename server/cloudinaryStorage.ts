import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check if Cloudinary is configured
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Check if we're running on Railway (or any non-Replit environment)
export function shouldUseCloudinary(): boolean {
  // If Cloudinary is configured, use it
  if (isCloudinaryConfigured()) {
    return true;
  }
  
  // If on Railway or PRIVATE_OBJECT_DIR is not set, we need Cloudinary
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
  const hasReplitStorage = !!process.env.PRIVATE_OBJECT_DIR;
  
  return isRailway || !hasReplitStorage;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
}

/**
 * Get a signed upload URL for direct browser uploads to Cloudinary
 */
export async function getCloudinaryUploadSignature(
  folder: string = 'chore-rewards'
): Promise<{ signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string }> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const params: Record<string, any> = {
    timestamp,
    folder,
  };

  // Generate signature
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
  
  console.log('☁️ Cloudinary signature params:', params);
  console.log('☁️ Generated signature:', signature);

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
  };
}

/**
 * Upload a file buffer directly to Cloudinary (server-side)
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    transformation?: any;
  } = {}
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'chore-rewards',
        public_id: options.publicId || randomUUID(),
        transformation: options.transformation,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        } else {
          reject(new Error('Upload failed with no result'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  await cloudinary.uploader.destroy(publicId);
}

console.log('🖼️  Cloudinary storage module loaded');
if (isCloudinaryConfigured()) {
  console.log('✅ Cloudinary is configured and ready');
} else {
  console.log('⚠️  Cloudinary not configured - will use Replit object storage if available');
}
