// Reads settings from the .env file so secrets never live in the code.
import 'dotenv/config';

export const config = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
};
