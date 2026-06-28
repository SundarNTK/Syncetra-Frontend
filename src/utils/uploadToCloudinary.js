const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const CHUNK_SIZE        = 6 * 1024 * 1024;   // 6 MB per chunk (Cloudinary min is 5 MB)
const CHUNKED_THRESHOLD = 90 * 1024 * 1024;  // use chunked upload for files > 90 MB

export const MAX_IMAGE_MB = 10;
export const MAX_VIDEO_MB = 100;

const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

export function validateFile(file) {
  const isImage = IMAGE_TYPES.includes(file.type);
  const isVideo = VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo) throw new Error("Use JPG, PNG, GIF, WebP, MP4, or WebM");
  if (isImage && file.size > MAX_IMAGE_BYTES)
    throw new Error(`Image too large — max ${MAX_IMAGE_MB} MB (this file is ${(file.size / 1024 / 1024).toFixed(1)} MB)`);
  if (isVideo && file.size > MAX_VIDEO_BYTES)
    throw new Error(`Video too large — max ${MAX_VIDEO_MB} MB (this file is ${(file.size / 1024 / 1024).toFixed(1)} MB)`);
  return isVideo ? "video" : "image";
}

function buildThumbUrl(secureUrl, resourceType) {
  if (resourceType === "video") {
    return secureUrl.replace("/video/upload/", "/video/upload/so_0,w_300,h_200,c_fill,f_jpg/");
  }
  return secureUrl.replace("/image/upload/", "/image/upload/w_300,h_200,c_fill,f_auto,q_auto/");
}

function genUploadId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function xhrPost(endpoint, formData, extraHeaders, onFraction) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    Object.entries(extraHeaders).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    if (onFraction) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onFraction(e.loaded / e.total);
      });
    }
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 206) {
        resolve({ status: xhr.status, data: xhr.status === 200 ? JSON.parse(xhr.responseText) : null });
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err?.error?.message || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.send(formData);
  });
}

async function uploadChunked(file, signData, resourceType, onProgress) {
  const { timestamp, signature, api_key, cloud_name, folder } = signData;
  const endpoint   = `https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`;
  const uploadId   = genUploadId();
  const totalSize  = file.size;
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
  let lastData = null;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end   = Math.min(start + CHUNK_SIZE, totalSize) - 1; // inclusive

    const fd = new FormData();
    fd.append("file", file.slice(start, end + 1), file.name);
    fd.append("api_key", api_key);
    fd.append("timestamp", String(timestamp));
    fd.append("signature", signature);
    fd.append("folder", folder);

    const chunkBase = i / totalChunks;
    const chunkSpan = 1 / totalChunks;

    const { status, data } = await xhrPost(
      endpoint,
      fd,
      {
        "X-Unique-Upload-Id": uploadId,
        "Content-Range": `bytes ${start}-${end}/${totalSize}`,
      },
      onProgress
        ? (frac) => onProgress(Math.round((chunkBase + frac * chunkSpan) * 100))
        : null
    );

    if (status === 200) lastData = data;
    if (onProgress) onProgress(Math.round(((i + 1) / totalChunks) * 100));
  }

  if (!lastData) throw new Error("Chunked upload completed but no final response received");
  return lastData;
}

export function uploadToCloudinary(file, signData, onProgress) {
  const resourceType = validateFile(file);

  const finish = (data) => ({
    url:       data.secure_url,
    publicId:  data.public_id,
    thumbUrl:  buildThumbUrl(data.secure_url, resourceType),
    mediaType: resourceType,
    fileName:  file.name,
  });

  // Large file → chunked upload
  if (file.size > CHUNKED_THRESHOLD) {
    return uploadChunked(file, signData, resourceType, onProgress).then(finish);
  }

  // Small file → single request
  const { timestamp, signature, api_key, cloud_name, folder } = signData;
  const endpoint = `https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", api_key);
    fd.append("timestamp", String(timestamp));
    fd.append("signature", signature);
    fd.append("folder", folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(finish(JSON.parse(xhr.responseText)));
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err?.error?.message || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.send(fd);
  });
}
