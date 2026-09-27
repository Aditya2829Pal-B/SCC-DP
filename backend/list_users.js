import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

async function listAndResetUsers() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      location: Object
    }, { strict: false });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    const allUsers = await User.find({}, 'name email role');
    console.log('=== REGISTERED ACCOUNTS IN DATABASE ===');
    allUsers.forEach((u, i) => {
      console.log(`${i + 1}. [${u.role.toUpperCase()}] Name: ${u.name} | Email: ${u.email}`);
    });
    console.log('=======================================\n');

    // Ensure Master Admin exists with known password
    const admin = await User.findOne({ role: 'admin' });
    const defaultAdminPassword = 'Admin@2026';
    const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);

    if (admin) {
      admin.password = hashedPassword;
      await admin.save();
      console.log(`🔑 Master Admin Credentials:`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${defaultAdminPassword}\n`);
    } else {
      const newAdmin = await User.create({
        name: 'System Admin',
        email: 'admin@sccdp.me',
        password: hashedPassword,
        role: 'admin',
        location: { type: 'Point', city: 'New Delhi', coordinates: [77.209, 28.6139] },
        sensitivity: 1.0
      });
      console.log(`🔑 Created Master Admin Credentials:`);
      console.log(`   Email: ${newAdmin.email}`);
      console.log(`   Password: ${defaultAdminPassword}\n`);
    }

  } catch (err) {
    console.error('Database connection / query error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

listAndResetUsers();
