const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000/api/v1'
).replace(/\/$/, '');

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];


function normalizeUploadUrl(url) {
  if (!url || typeof url !== 'string') return url;

  // Already a same-origin path.
  if (url.startsWith('/')) return url;

  try {
    const parsed = new URL(url);
    if (parsed.pathname?.startsWith('/uploads/')) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return url;
  }

  return url;
}

function getCsrfToken() {
  if (typeof document === 'undefined') return null;
  return document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('ko_csrf='))
    ?.split('=')
    .slice(1)
    .join('=') || null;
}
function uploadViaXhr(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${path}`);
    xhr.withCredentials = true;
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      xhr.setRequestHeader('X-CSRF-Token', csrfToken);
    }
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || typeof onProgress !== 'function') return;
      const progress = Math.round((event.loaded / event.total) * 100);
      onProgress(progress);
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onload = () => {
      try {
        const json = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        if (xhr.status < 200 || xhr.status >= 300 || json?.success === false) {
          const message = json?.error?.message || 'Upload failed';
          reject(new Error(message));
          return;
        }
        const payload = json?.data || json;
        if (payload && typeof payload === 'object') {
          resolve({
            ...payload,
            imageUrl: normalizeUploadUrl(payload.imageUrl),
            imageThumbnailUrl: normalizeUploadUrl(payload.imageThumbnailUrl),
            avatarUrl: normalizeUploadUrl(payload.avatarUrl),
            avatarThumbnailUrl: normalizeUploadUrl(payload.avatarThumbnailUrl),
          });
          return;
        }

        resolve(payload);
      } catch {
        reject(new Error('Invalid upload response'));
      }
    };

    xhr.send(formData);
  });
}

export function validateImageFile(file, options = {}) {
  if (!file) return { valid: false, error: 'No file selected' };

  const maxBytes = options.maxBytes || DEFAULT_MAX_BYTES;
  const allowedTypes = options.allowedTypes || DEFAULT_TYPES;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type. Allowed: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File is too large. Max size is ${Math.round(maxBytes / 1024 / 1024)}MB`,
    };
  }

  return { valid: true };
}

export function createPreviewURL(file) {
  if (!file) return null;
  return URL.createObjectURL(file);
}

export async function uploadRecipeImage(file, recipeId, onProgress) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('recipeId', recipeId);
  return uploadViaXhr('/upload/recipe-image', formData, onProgress);
}

export async function uploadUserAvatar(file, onProgress) {
  const formData = new FormData();
  formData.append('avatar', file);
  return uploadViaXhr('/upload/user-avatar', formData, onProgress);
}

export async function deleteImage(storagePath) {
  if (!storagePath) return;
  const normalized = storagePath
    .replace(/\\/g, '/')
    .replace(/^.*\/uploads\//, '');
     const csrfToken = getCsrfToken();
  const response = await fetch(`${API_BASE}/upload/image/${normalized}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
  });
  if (!response.ok) {
    const json = await response.json().catch(() => null);
    throw new Error(json?.error?.message || 'Failed to delete image');
  }
}
