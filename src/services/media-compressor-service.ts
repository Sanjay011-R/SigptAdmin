/**
 * Client-Side Media Compressor & Decompressor Engine
 * - Adaptive device-based resolution scaling (Desktop / Tablet / Mobile)
 * - Canvas HTML5 Blob compression (JPEG/WebP)
 * - Automatic video frame poster thumbnail extraction
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/webp" | "image/jpeg";
}

/**
 * Calculates adaptive target max width based on current device viewport screen width & DPR
 */
export function getAdaptiveDeviceMaxWidth(): number {
  if (typeof window === "undefined") return 1200;
  const screenWidth = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;

  if (screenWidth <= 640) {
    // Mobile viewport
    return Math.min(720, Math.round(screenWidth * dpr));
  } else if (screenWidth <= 1024) {
    // Tablet viewport
    return Math.min(1080, Math.round(screenWidth * dpr));
  } else {
    // Desktop viewport
    return Math.min(1920, Math.round(1920 * Math.min(dpr, 1.5)));
  }
}

/**
 * Compresses an image file or Data URL into an optimized Blob
 */
export async function compressImage(
  fileOrUrl: File | Blob | string,
  options?: CompressionOptions
): Promise<{
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
}> {
  const targetMaxWidth = options?.maxWidth || getAdaptiveDeviceMaxWidth();
  const targetMaxHeight = options?.maxHeight || targetMaxWidth;
  const quality = options?.quality ?? 0.82;
  const format = options?.format || "image/webp";

  let originalSize = 0;
  if (fileOrUrl instanceof File || fileOrUrl instanceof Blob) {
    originalSize = fileOrUrl.size;
  } else if (typeof fileOrUrl === "string") {
    originalSize = Math.round((fileOrUrl.length * 3) / 4);
  }

  const img = new Image();

  if (typeof fileOrUrl === "string") {
    img.src = fileOrUrl;
  } else {
    img.src = URL.createObjectURL(fileOrUrl);
  }

  await new Promise((resolve, reject) => {
    img.onload = () => resolve(true);
    img.onerror = (err) => reject(err);
  });

  // Calculate scaled dimensions
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > targetMaxWidth || height > targetMaxHeight) {
    const aspectRatio = width / height;
    if (width > height) {
      width = targetMaxWidth;
      height = Math.round(targetMaxWidth / aspectRatio);
    } else {
      height = targetMaxHeight;
      width = Math.round(targetMaxHeight * aspectRatio);
    }
  }

  // Draw on Canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize 2D canvas context");

  // Quality smoothing options
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  // Clean up ObjectURL if created
  if (typeof fileOrUrl !== "string") {
    URL.revokeObjectURL(img.src);
  }

  // Export to Blob
  const blob: Blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else resolve(new Blob([], { type: format }));
      },
      format,
      quality
    );
  });

  const dataUrl = canvas.toDataURL(format, quality);

  return {
    blob,
    dataUrl,
    width,
    height,
    originalSize: originalSize || blob.size,
    compressedSize: blob.size,
  };
}

/**
 * Extracts a poster thumbnail image frame (at 0.5s) from an uploaded video file
 */
export async function extractVideoPoster(videoFile: File | Blob): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;

    video.onloadedmetadata = () => {
      // Seek to 0.5s or midpoint if video is very short
      video.currentTime = Math.min(0.5, video.duration / 2 || 0);
    };

    video.onseeked = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        URL.revokeObjectURL(videoUrl);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b || new Blob()), "image/jpeg", 0.8));

        resolve({ blob, dataUrl });
      } catch (err) {
        URL.revokeObjectURL(videoUrl);
        reject(err);
      }
    };

    video.onerror = (err) => {
      URL.revokeObjectURL(videoUrl);
      reject(err);
    };
  });
}

/**
 * Converts a stored media Blob into an active object URL for browser playback
 */
export function decompressMediaUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
