import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("❌ OPENAI_API_KEY is missing in .env");
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

console.log("Attempting to connect to OpenAI API...");

async function testOpenAI() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Say "OpenAI integration is successful!"' }
      ]
    });
    console.log("✅ Success! Response from OpenAI:", response.choices[0].message.content);
  } catch (err) {
    console.error("❌ Failed to connect to OpenAI:", err.message);
  }
}

testOpenAI();
