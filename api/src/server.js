// Entry point: connect to MongoDB, then start the API.
import mongoose from 'mongoose';
import { app } from './app.js';
import { config } from './config.js';

if (!config.mongoUri) {
  console.error('MONGO_URI is missing. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

await mongoose.connect(config.mongoUri);
console.log('Connected to MongoDB');

app.listen(config.port, () => console.log(`Mohalla API on http://localhost:${config.port}`));
