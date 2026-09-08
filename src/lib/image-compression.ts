// Client-side image compression/resizing, used before an image File is stored
// in form state and eventually uploaded. Purely a frontend optimization — it
// does not change the upload request architecture, field names, or backend
// in any way. It only ever shrinks an image File into a smaller File of the
// SAME mime type before the rest of the existing code (FileReader preview,
// FormData, etc.) touches it.
//
// Safety guarantees:
// - Only ever processes known, browser-safe raster types (image/jpeg,
//   image/png). Anything else — PDF, DOC, DOCX, HEIC/HEIF, unknown/unsupported
//   image formats — is returned completely untouched.
// - Never throws. Any decode/encode failure falls back to the original file.
// - Never makes a file bigger, or bothers re-encoding an already-small image.

const MAX_DIMENSION = 1600; // px, longest edge — plenty for ID/photo verification
const JPEG_QUALITY = 0.82;
const JPEG_QUALITY_FALLBACK = 0.6;
const SKIP_IF_UNDER_BYTES = 400 * 1024; // already small enough, don't bother
const RETRY_IF_OVER_BYTES = 1.5 * 1024 * 1024; // still big after first pass, try lower quality once

const COMPRESSIBLE_TYPES = new Set(["image/jpeg", "image/png"]);

export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!COMPRESSIBLE_TYPES.has(file.type)) {
    // Not a browser-safe raster type we know how to re-encode (PDF, DOC,
    // HEIC/HEIF, etc.) — leave it exactly as the user selected it.
    return file;
  }

  if (file.size <= SKIP_IF_UNDER_BYTES) {
    // Already small — recompressing would only cost quality for no benefit.
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const longEdge = Math.max(bitmap.width, bitmap.height);

    if (longEdge <= MAX_DIMENSION && file.size <= RETRY_IF_OVER_BYTES) {
      // Already a sensible size and resolution — skip.
      bitmap.close?.();
      return file;
    }

    const scale = Math.min(1, MAX_DIMENSION / longEdge);
    const targetWidth = Math.max(1, Math.round(bitmap.width * scale));
    const targetHeight = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close?.();

    const isJpeg = file.type === "image/jpeg";
    // PNG re-encoding in the browser is lossless — the quality argument only
    // has an effect for image/jpeg (and image/webp, which we don't use here).
    let blob = await canvasToBlob(canvas, file.type, isJpeg ? JPEG_QUALITY : undefined);

    if (isJpeg && blob && blob.size > RETRY_IF_OVER_BYTES) {
      blob = await canvasToBlob(canvas, file.type, JPEG_QUALITY_FALLBACK);
    }

    if (!blob || blob.size >= file.size) {
      // Didn't actually help (rare — e.g. image was already well-optimized).
      // Keep the original rather than swap in a same-size-or-larger file.
      return file;
    }

    return new File([blob], file.name, { type: file.type, lastModified: Date.now() });
  } catch {
    // Any failure decoding/encoding (corrupt file, a format the browser
    // mis-reported as image/jpeg or image/png, etc.) — never break the
    // upload, just fall back to the original file untouched.
    return file;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
