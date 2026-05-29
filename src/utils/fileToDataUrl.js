const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_VIDEO_BYTES = 10 * 1024 * 1024;

function resizeToDataUrl(source, maxPx, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w > maxPx || h > maxPx) {
        if (w > h) { h = Math.round((h * maxPx) / w); w = maxPx; }
        else { w = Math.round((w * maxPx) / h); h = maxPx; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = source;
  });
}

/**
 * Convert a file to a compressed data URL.
 * Images: resized to max 1200px (JPEG 80%) + 120px thumbnail (JPEG 60%).
 * Videos: read as-is (no thumbnail).
 */
export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    if (!file) { reject(new Error("No file selected")); return; }

    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      reject(new Error("Use JPG, PNG, GIF, WebP, MP4, or WebM"));
      return;
    }

    const maxSize = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxSize) {
      reject(new Error(isVideo ? "Video must be under 10 MB" : "Image must be under 4 MB"));
      return;
    }

    if (isVideo) {
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result, thumbUrl: "", mediaType: "video", fileName: file.name });
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
      return;
    }

    // Image: read raw, then compress full + thumbnail in parallel
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const raw = e.target.result;
        const [dataUrl, thumbUrl] = await Promise.all([
          resizeToDataUrl(raw, 1200, 0.80),
          resizeToDataUrl(raw, 120, 0.60),
        ]);
        resolve({ dataUrl, thumbUrl, mediaType: "image", fileName: file.name });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

export { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES };
