// A job holds its agreement inside it. Entries are only ever added or have
// their status changed from "proposed" to accepted/rejected: never edited or
// deleted. That append-only list is the record disputes are judged against.
import mongoose from 'mongoose';
import { CATEGORIES } from '../lib/rules.js';

const { Schema } = mongoose;

const agreementEntrySchema = new Schema({
  kind: { type: String, enum: ['visit', 'quote', 'amendment', 'part'], required: true },
  amount: { type: Number, required: true, min: 0 },
  scope: { type: String, maxlength: 500 },
  billPhotoUrl: String, // required for parts (checked in the route)
  status: { type: String, enum: ['proposed', 'accepted', 'rejected'], default: 'proposed' },
  proposedAt: { type: Date, default: Date.now },
  decidedAt: Date,
});

const quoteSchema = new Schema({
  worker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0 },
  note: { type: String, maxlength: 300 },
  createdAt: { type: Date, default: Date.now },
});

const jobSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  worker: { type: Schema.Types.ObjectId, ref: 'User' }, // empty while a posted job is open
  mode: { type: String, enum: ['direct', 'quotes'], required: true },

  category: { type: String, enum: CATEGORIES, required: true },
  description: { type: String, required: true, maxlength: 1000 },
  area: { type: String, required: true },
  address: { type: String, required: true }, // only shown to the worker after accepting
  preferredTime: Date,
  photos: [String], // up to 3 photos of the problem, from the customer
  voiceNoteUrl: String, // should-have; unused until uploads are added

  // open      = posted job collecting quotes
  // requested = direct request waiting for the worker
  // accepted  = worker said yes; visit charge / quote being agreed
  // agreed    = full quote accepted; work can happen
  // completed = customer marked done
  status: {
    type: String,
    enum: ['open', 'requested', 'accepted', 'agreed', 'completed', 'declined', 'expired', 'cancelled'],
    required: true,
  },
  expiresAt: Date,
  acceptedAt: Date, // when the worker said yes (shown on the customer's job timeline)
  cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },

  quotes: [quoteSchema],
  agreement: [agreementEntrySchema],

  payment: {
    workerAmount: Number,   // worker: "I was paid this much in cash"
    customerAmount: Number, // customer: "I paid this much"
    matched: { type: Boolean, default: false },
  },
  onTime: Boolean,
  completedAt: Date,
}, { timestamps: true });

export default mongoose.model('Job', jobSchema);
