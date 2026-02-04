// Utility to reset admin password
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Admin from '../models/admin.js';
import { decryptAdminData } from '../controller/decryptionController.js';

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const resetAdminPassword = async (email, newPassword) => {
  try {
    console.log('🔍 MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find all admins and decrypt to find by email
    const admins = await Admin.find({});
    let targetAdmin = null;

    for (const admin of admins) {
      try {
        const decrypted = decryptAdminData(admin.toObject());
        if (decrypted.email.toLowerCase() === email.toLowerCase()) {
          targetAdmin = admin;
          break;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to decrypt admin ${admin._id}`);
      }
    }

    if (!targetAdmin) {
      console.error(`❌ Admin with email ${email} not found`);
      process.exit(1);
    }

    console.log(`✅ Found admin: ${targetAdmin._id}`);

    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password directly (bypass pre-save hook)
    await Admin.updateOne(
      { _id: targetAdmin._id },
      { $set: { password: hashedPassword } }
    );

    console.log(`✅ Password updated successfully for ${email}`);
    console.log(`🔑 New password: ${newPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Get email and password from command line arguments
const email = process.argv[2] || 'admnstrator23@gmail.com';
const newPassword = process.argv[3] || 'admin123456';

console.log(`🔄 Resetting password for: ${email}`);
console.log(`🔑 New password will be: ${newPassword}`);

resetAdminPassword(email, newPassword);
