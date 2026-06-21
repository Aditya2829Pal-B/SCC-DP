import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
let content = fs.readFileSync(envPath, 'utf8');

// Extract the password and user
const srvMatch = content.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@sccdp-cluster/);

if (srvMatch) {
  const user = srvMatch[1];
  let pass = srvMatch[2];
  
  // Ensure the password is URL encoded if it contains special characters
  if (!pass.includes('%')) {
    pass = encodeURIComponent(pass);
  }

  const legacyStr = `mongodb://${user}:${pass}@ac-nhqj1i7-shard-00-00.6ave2w8.mongodb.net:27017,ac-nhqj1i7-shard-00-01.6ave2w8.mongodb.net:27017,ac-nhqj1i7-shard-00-02.6ave2w8.mongodb.net:27017/sccdp?ssl=true&replicaSet=atlas-75drlk-shard-0&authSource=admin&retryWrites=true&w=majority&appName=sccdp-cluster`;

  content = content.replace(/MONGO_URI=".*"/, `MONGO_URI="${legacyStr}"`);
  content = content.replace(/MONGO_URI=mongodb\+srv.*/, `MONGO_URI="${legacyStr}"`);
  
  fs.writeFileSync(envPath, content);
  console.log("Rewrote MONGO_URI in .env to use legacy connection string to bypass SRV DNS bug.");
} else {
  console.log("Could not find srv connection string in .env");
}
