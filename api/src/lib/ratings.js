import { Review } from '../models/others.js';

// Average of the ratings that are already visible, for a list of user ids.
// Returns a Map: userId -> { avg, count }. Used for workers AND customers,
// since workers can see a customer's rating before accepting a job.
export async function visibleRatings(ids) {
  const rows = await Review.aggregate([
    { $match: { to: { $in: ids }, visibleAt: { $lte: new Date() } } },
    { $group: { _id: '$to', avg: { $avg: '$stars' }, count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), { avg: Math.round(r.avg * 10) / 10, count: r.count }]));
}
