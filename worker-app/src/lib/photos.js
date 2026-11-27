// Taking or choosing a photo, shrinking it, and uploading it to the API.
// Phone photos are 3-8 MB; we resize to 1200px wide and compress, so each
// upload is about 100-300 KB (fast on mobile data, small in the database).
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { api } from './api';

const MAX_WIDTH = 1200;

// from: 'camera' | 'gallery'. Returns { uri, base64 } or null if the person cancelled.
// Throws an error with code 'no_camera_permission' if the camera was refused.
export async function pickPhoto(from = 'camera') {
  let result;
  if (from === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      const err = new Error('Camera permission was refused');
      err.code = 'no_camera_permission';
      throw err;
    }
    result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
  } else {
    result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  }
  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  if (!asset.width || asset.width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.6, format: SaveFormat.JPEG, base64: true });
  return { uri: saved.uri, base64: saved.base64 };
}

// Uploads a picked photo; returns the url to save on the job ("/api/photos/<key>").
export async function uploadPhoto(photo) {
  const { url } = await api('/photos', { method: 'POST', body: { data: `data:image/jpeg;base64,${photo.base64}` } });
  return url;
}
