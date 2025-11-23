import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from './models/admin.js';
import { decryptAdminData } from './controller/decryptionController.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const testAdminLogin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database');

    // Get all admin records
    const admins = await Admin.find({});
    console.log(`📊 Found ${admins.length} admin records in database`);

    // Test decryption for each admin
    for (const admin of admins) {
      console.log('\n------- Admin Record -------');
      console.log('Raw admin data:', {
        _id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        password: admin.password?.substring(0, 10) + '...'
      });

      try {
        const decryptedAdmin = decryptAdminData(admin.toObject());
        console.log('Decrypted admin data:', {
          email: decryptedAdmin.email,
          firstName: decryptedAdmin.firstName,
          lastName: decryptedAdmin.lastName
        });

        // Test password comparison with more possibilities
        const testPasswords = [
          'admin123456', 'password', 'admin', 'administrator', 
          'admin123', '123456', 'password123', 'admin@123',
          'buksu123', 'grading123', 'system123', 'default',
          'root', 'buksu', 'grading', 'system'
        ];
        for (const testPassword of testPasswords) {
          const isValid = await admin.comparePassword(testPassword);
          console.log(`Password "${testPassword}" valid: ${isValid}`);
          if (isValid) {
            console.log(`🎉 FOUND VALID PASSWORD: ${testPassword} for ${decryptedAdmin.email}`);
          }
        }
      } catch (error) {
        console.error('❌ Error decrypting admin data:', error.message);
      }
    }

    // Test direct email comparison with the ones from env
    console.log('\n------- Testing Email Matches -------');
    const testEmails = ['admnstrator23@gmail.com', 'admin1@gmail.com'];
    
    for (const testEmail of testEmails) {
      console.log(`\nTesting email: ${testEmail}`);
      for (const admin of admins) {
        try {
          const decryptedAdmin = decryptAdminData(admin.toObject());
          const emailMatch = decryptedAdmin.email?.toLowerCase() === testEmail.toLowerCase();
          console.log(`  Admin ${admin._id}: ${decryptedAdmin.email} === ${testEmail} : ${emailMatch}`);
        } catch (error) {
          console.log(`  Admin ${admin._id}: Decryption failed - ${error.message}`);
        }
      }
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from database');
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
};

testAdminLogin();