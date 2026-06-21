import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../src/models/index.js';

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sccdp');
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@demo.com';
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await User.create({
      name: 'Aditya Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      location: {
        city: 'New Delhi',
        coordinates: [77.2090, 28.6139]
      },
      sensitivity: 1.0
    });

    console.log('Admin user created successfully! Email: admin@demo.com, Password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
