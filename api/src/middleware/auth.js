// Login works with JSON Web Tokens (JWT): on login the API signs a token
// holding the user's id; the apps send it back on every request in the
// "Authorization: Bearer <token>" header. The same scheme works for web and mobile.
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import User from '../models/User.js';
import { httpError } from '../lib/http.js';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, config.jwtSecret, { expiresIn: '30d' });
}

// requireAuth() = any logged-in user; requireAuth('admin') = admins only, etc.
export function requireAuth(...roles) {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) throw httpError(401, 'Log in first');

      let payload;
      try {
        payload = jwt.verify(token, config.jwtSecret);
      } catch {
        throw httpError(401, 'Your session expired. Log in again.');
      }

      const user = await User.findById(payload.sub);
      if (!user) throw httpError(401, 'Account not found');

      // A timed suspension ends by itself once its date passes.
      if (user.status === 'suspended' && user.suspendedUntil && user.suspendedUntil < new Date()) {
        user.status = 'active';
        user.suspendedUntil = undefined;
        await user.save();
      }
      if (user.status !== 'active') throw httpError(403, `This account is ${user.status}`);
      if (roles.length && !roles.includes(user.role)) throw httpError(403, 'Not allowed for your account type');

      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  };
}
