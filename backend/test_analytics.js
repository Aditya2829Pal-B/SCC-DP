import { connectDB } from './src/utils/database.js';
import { getDashboardOverview } from './src/controllers/analyticsController.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  await connectDB();
  const req = {};
  const res = {
    status: (code) => ({
      json: (data) => {
        console.log("Response:", JSON.stringify(data, null, 2));
      }
    }),
    setHeader: () => {}
  };
  const next = (err) => console.error("Error:", err);
  
  await getDashboardOverview(req, res, next);
  process.exit(0);
}
test();
