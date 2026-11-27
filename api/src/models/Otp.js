// One-time codes for sign-up and "forgot PIN". The code itself is stored
// hashed (like a PIN), and MongoDB deletes each document by itself once
// expiresAt passes (the TTL index below), so old codes never pile up.
import mongoose from 'mongoose';

const { Schema } = mongoose;

const otpSchema = new Schema({
  phone: { type: String, required: true },
  purpose: { type: String, enum: ['signup', 'reset', 'change'], required: true },
  channel: { type: String, enum: ['sms', 'whatsapp'], required: true },
  codeHash: { type: String, required: true },
  tries: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ phone: 1, purpose: 1 });

export default mongoose.model('Otp', otpSchema);
