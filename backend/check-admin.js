import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from './models/admin.js';
import { decryptAdminData } from './controller/decryptionController.js';

dotenv.config();

const checkAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    const admins = await Admin.find({});
    console.log(`📊 Found ${admins.length} admin(s) in database:\n`);

    for (let i = 0; i < admins.length; i++) {
      const admin = admins[i];
      console.log(`--- Admin ${i + 1} ---`);
      
      try {
        const decrypted = decryptAdminData(admin.toObject());
        console.log(`Email: ${decrypted.email}`);
        console.log(`Name: ${decrypted.firstName} ${decrypted.lastName}`);
        console.log(`Status: ${admin.status}`);
        console.log(`Role: ${admin.role}`);
        console.log(`Password Hash: ${admin.password.substring(0, 20)}...`);
        console.log('');
      } catch (error) {
        console.log(`❌ Error decrypting: ${error.message}\n`);
      }
    }

    console.log('💡 To login, use:');
    const firstAdmin = admins[0];
    if (firstAdmin) {
      const decrypted = decryptAdminData(firstAdmin.toObject());
      console.log(`   Email: ${decrypted.email}`);
      console.log(`   Password: admin123456 (default from .env)`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
};

checkAdmin();
