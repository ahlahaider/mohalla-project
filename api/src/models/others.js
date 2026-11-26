// The four smaller collections, kept in one file because each is short.
import mongoose from 'mongoose';

const { Schema } = mongoose;
const ref = (model) => ({ type: Schema.Types.ObjectId, ref: model });

// Ratings go both ways. visibleAt hides a rating until both sides have rated
// (or 7 days pass), so nobody can retaliate after reading the other's review.
const reviewSchema = new Schema({
  job: { ...ref('Job'), required: true },
  from: { ...ref('User'), required: true },
  to: { ...ref('User'), required: true },
  stars: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 500 },
  visibleAt: { type: Date, required: true },
}, { timestamps: true });
reviewSchema.index({ job: 1, from: 1 }, { unique: true }); // one review per side per job

const disputeSchema = new Schema({
  job: { ...ref('Job'), required: true },
  openedBy: { ...ref('User'), required: true },
  against: { ...ref('User'), required: true },
  type: { type: String, enum: ['no-show', 'non-payment', 'scope', 'misconduct'], required: true },
  statements: [{
    by: ref('User'),
    text: { type: String, maxlength: 2000 },
    evidenceUrls: [String],
    at: { type: Date, default: Date.now },
  }],
  respondBy: Date,
  status: { type: String, enum: ['open', 'upheld', 'unresolved', 'settled'], default: 'open' },
  ruling: { against: ref('User'), note: String, admin: ref('User'), at: Date },
}, { timestamps: true });

const vouchSchema = new Schema({
  from: { ...ref('User'), required: true },
  to: { ...ref('User'), required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const reportSchema = new Schema({
  from: { ...ref('User'), required: true },
  against: { ...ref('User'), required: true },
  reason: { type: String, required: true, maxlength: 1000 },
  safety: { type: Boolean, default: false }, // safety reports suspend straight away
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });

export const Review = mongoose.model('Review', reviewSchema);
export const Dispute = mongoose.model('Dispute', disputeSchema);
export const Vouch = mongoose.model('Vouch', vouchSchema);
export const Report = mongoose.model('Report', reportSchema);
