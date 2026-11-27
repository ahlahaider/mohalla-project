// Photos (bills, the customer's problem, dispute evidence, profile pictures).
// Kept inside MongoDB so the project needs no extra account (e.g. Cloudinary).
// The apps shrink every photo to about 1200px before uploading, so each is
// roughly 100-300 KB and the free Atlas tier holds thousands of them.
import mongoose from 'mongoose';

const { Schema } = mongoose;

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PHOTO_MAX_BYTES = 2.5 * 1024 * 1024;

const photoSchema = new Schema({
  // A long random key is the photo's address (/api/photos/<key>), so nobody can guess other people's photos.
  key: { type: String, required: true, unique: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mime: { type: String, enum: PHOTO_TYPES, required: true },
  data: { type: Buffer, required: true },
  size: Number,
}, { timestamps: true });

export default mongoose.model('Photo', photoSchema);
