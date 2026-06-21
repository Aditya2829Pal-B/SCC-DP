import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const uri = "mongodb+srv://Aditya-sccdp_admin:SffH8pCX357ii9V8@sccdp-cluster.6ave2w8.mongodb.net/sccdp?retryWrites=true&w=majority&appName=sccdp-cluster";

console.log("Attempting to connect to MongoDB Atlas using SRV with Google DNS...");

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Successfully connected to MongoDB Atlas!");
    const db = mongoose.connection.db;
    const adminDb = db.admin();
    adminDb.command({ isMaster: 1 })
      .then(result => {
        console.log("Replica Set Name:", result.setName);
        process.exit(0);
      })
      .catch(err => {
        console.error(err);
        process.exit(1);
      });
  })
  .catch((err) => {
    console.error("❌ Failed to connect:", err.message);
    process.exit(1);
  });
