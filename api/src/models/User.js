// One collection for all three roles. A worker's profile is embedded in their
// user document because it is always loaded together with the user.
import mongoose from 'mongoose';
import { CATEGORIES, reliability } from '../lib/rules.js';

const { Schema } = mongoose;

const workerProfileSchema = new Schema({
  skills: [{ type: String, enum: CATEGORIES }],
  areasServed: [String],
  priceMin: { type: Number, min: 0 },
  priceMax: { type: Number, min: 0 },
  bio: { type: String, maxlength: 500 },
  gender: { type: String, enum: ['female', 'male', 'unspecified'], default: 'unspecified' },
  availableToday: { type: Boolean, default: false },
  featured: { type: Boolean, default: false }, // paid placement, admin toggle in v1
}, { _id: false });

const userSchema = new Schema({
  role: { type: String, enum: ['customer', 'worker', 'admin'], required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true }, // one account per phone
  // Customers: a hashed 4-digit PIN. Workers and admin: a hashed password (for now).
  // Hidden by default so it is never sent back by accident.
  passwordHash: { type: String, required: true, select: false },
  failedLogins: { type: Number, default: 0 }, // wrong PINs in a row (see PIN_LOCK in rules.js)
  lockedUntil: Date,
  area: String,
  language: { type: String, enum: ['en', 'roman-ur'], default: 'en' },

  status: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active' },
  suspendedUntil: Date, // empty while suspended = waiting for admin review
  flaggedForReview: { type: Boolean, default: false }, // 3 unresolved disputes in 30 days
  strikes: [{ reason: String, dispute: { type: Schema.Types.ObjectId, ref: 'Dispute' }, at: Date }],

  badges: {
    verified: { type: Boolean, default: false }, // simulated ID check
    founding: { type: Boolean, default: false }, // established business, vetted by hand
  },

  // Counters, updated as jobs change state. Profiles show these as plain numbers.
  stats: {
    jobsAccepted: { type: Number, default: 0 },
    jobsCompleted: { type: Number, default: 0 },
    onTimeYes: { type: Number, default: 0 },
    onTimeAsked: { type: Number, default: 0 },
    paidOnRecord: { type: Number, default: 0 },
  },

  vouchWarnings: { type: Number, default: 0 },
  vouchingRevoked: { type: Boolean, default: false },
  // "Someone is helping me": who set up this account for the worker (a shop, friend or family).
  assistedBy: {
    name: { type: String, trim: true, maxlength: 80 },
    phone: String,
    relation: { type: String, enum: ['shop', 'friend', 'family', 'other'] },
  },
  photoUrl: String, // profile photo (/api/photos/...)

  workerProfile: workerProfileSchema,
}, { timestamps: true });

// The safe, public version of a user: what other people are allowed to see.
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    role: this.role,
    name: this.name,
    area: this.area,
    photoUrl: this.photoUrl,
    badges: this.badges,
    reliability: reliability(this.stats),
    stats: this.role === 'customer' ? { jobsCompleted: this.stats.jobsCompleted, paidOnRecord: this.stats.paidOnRecord } : undefined,
    workerProfile: this.workerProfile,
    status: this.status,
  };
};

export default mongoose.model('User', userSchema);
