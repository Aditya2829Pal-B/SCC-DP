import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

async function resetAdminPassword() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    // Import User schema dynamically or define a simple one
    const userSchema = new mongoose.Schema({
      email: String,
      password: String,
      role: String,
    }, { strict: false });
    
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Find the admin user
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('No admin user found! Creating one...');
      const hashedPassword = await bcrypt.hash('Admin@2026', 10);
      const newAdmin = await User.create({
        name: 'System Admin',
        email: 'admin@sccdp.me',
        password: hashedPassword,
        role: 'admin',
        location: { type: 'Point', city: 'New Delhi', coordinates: [77.209, 28.6139] },
        sensitivity: 1.0
      });
      console.log('Created new admin account!');
      console.log(`Email: ${newAdmin.email}`);
      console.log('Password: Admin@2026');
    } else {
      console.log(`Found existing admin account: ${admin.email}`);
      // Reset the password
      const hashedPassword = await bcrypt.hash('Admin@2026', 10);
      admin.password = hashedPassword;
      await admin.save();
      console.log('Password successfully reset!');
      console.log(`Email: ${admin.email}`);
      console.log('New Password: Admin@2026');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

resetAdminPassword();
