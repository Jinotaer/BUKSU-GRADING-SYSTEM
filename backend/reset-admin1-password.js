import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

dotenv.config();

// Admin Schema (simplified for this script)
const adminSchema = new mongoose.Schema({
  email: String,
  password: String,
  firstName: String,
  lastName: String,
  role: String,
  status: String,
});

const Admin = mongoose.model('Admin', adminSchema);

// Decryption function
const algorithm = "aes-256-cbc";
const secretKey = process.env.ENCRYPTION_SECRET_KEY || '12c64ab616476558cd1c101176c1cb8988d7fcdf2689f8511a2f69d3d822473e';

const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  try {
    const [ivHex, encryptedHex] = encryptedText.split(":");
    if (!ivHex || !encryptedHex) return encryptedText;
    
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, "hex"), iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    return encryptedText;
  }
};

const resetAdmin1Password = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all admins
    const admins = await Admin.find({});
    console.log(`📊 Found ${admins.length} admin(s) in database`);

    let targetAdmin = null;
    for (const admin of admins) {
      const decryptedEmail = decrypt(admin.email);
      console.log(`🔍 Checking admin: ${decryptedEmail}`);
      if (decryptedEmail === 'admin1@gmail.com') {
        targetAdmin = admin;
        break;
      }
    }

    if (!targetAdmin) {
      console.log('❌ Admin with email admin1@gmail.com not found');
      process.exit(1);
    }

    console.log('✅ Found admin1@gmail.com');
    console.log('🔐 Resetting password to: admin123456');

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash('admin123456', 12);
    
    targetAdmin.password = hashedPassword;
    await targetAdmin.save();

    console.log('✅ Password reset successful!');
    console.log('📧 Email: admin1@gmail.com');
    console.log('🔑 Password: admin123456');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

resetAdmin1Password();
