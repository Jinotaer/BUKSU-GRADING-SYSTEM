import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from './models/admin.js';
import { decryptAdminData } from './controller/decryptionController.js';
import { encryptAdminData } from './controller/encryptionController.js';

dotenv.config();

const resetAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database\n');

    const email = 'admnstrator23@gmail.com';
    const newPassword = 'admin123456';

    console.log(`🔍 Looking for admin: ${email}`);
    
    // Find admin by decrypting all admins
    const admins = await Admin.find({});
    let admin = null;
    
    for (const a of admins) {
      const decrypted = decryptAdminData(a.toObject());
      if (decrypted.email.toLowerCase() === email.toLowerCase()) {
        admin = a;
        break;
      }
    }

    if (!admin) {
      console.log('❌ Admin not found!');
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ Found admin: ${admin._id}`);
    console.log(`🔄 Resetting password to: ${newPassword}`);

    // Update password - the pre-save hook will hash it automatically
    admin.password = newPassword;
    await admin.save();

    console.log('✅ Password reset successfully!');
    console.log('\n💡 You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
};

resetAdminPassword();
