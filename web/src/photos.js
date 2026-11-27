// Shrinks a photo in the browser and uploads it to the API.
// Phone photos are 3-8 MB; we resize to 1200px wide and save as JPEG, so each
// upload is about 100-300 KB (fast on mobile data, small in the database).
import { api } from './api.js';

const MAX_WIDTH = 1200;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(Object.assign(new Error('bad photo'), { code: 'bad_photo' })); };
    img.src = url;
  });
}

// Returns the address to save on the job: "/api/photos/<key>".
export async function uploadPhoto(file) {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_WIDTH / img.naturalWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = canvas.toDataURL('image/jpeg', 0.6);
  const { url } = await api('/photos', { method: 'POST', body: { data } });
  return url;
}
