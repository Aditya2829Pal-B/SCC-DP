import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("MONGO_URI is missing in .env");
  process.exit(1);
}

console.log("Attempting to connect to MongoDB...");

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB Atlas!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB Atlas:", err.message);
    process.exit(1);
  });
