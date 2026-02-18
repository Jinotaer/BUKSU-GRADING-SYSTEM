// seeders/seedAdminAccounts.js
import bcrypt from "bcryptjs";
import Admin from "../models/admin.js";
import { encryptAdminData } from "../controller/encryptionController.js";
import { decryptAdminData, isEncrypted } from "../controller/decryptionController.js";

const parseAdminsFromEnv = () => {
  const raw = process.env.ADMIN_ACCOUNTS;
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
      console.warn("⚠️ ADMIN_ACCOUNTS is not an array. Falling back to single ADMIN_* vars.");
    } catch (e) {
      console.warn("⚠️ Failed to parse ADMIN_ACCOUNTS JSON. Falling back to single ADMIN_* vars.");
    }
  }
  // Fallback to single admin from individual envs
  return [{
    email:     process.env.ADMIN_EMAIL     || "admin@buksu.edu.ph",
    password:  process.env.ADMIN_PASSWORD  || "admin123456",
    firstName: process.env.ADMIN_FIRST_NAME || "System",
    lastName:  process.env.ADMIN_LAST_NAME  || "Administrator",
    schoolName: process.env.ADMIN_SCHOOL_NAME // optional
  }];
};

const normalize = v => (typeof v === "string" ? v.trim() : v);

const seedAdminAccounts = async () => {
  const admins = parseAdminsFromEnv()
    .filter(a => a && a.email)
    .map(a => ({
      email: normalize(a.email?.toLowerCase()),
      password: a.password || "admin123456",
      firstName: normalize(a.firstName) || "System",
      lastName: normalize(a.lastName) || "Administrator",
      ...(a.schoolName ? { schoolName: normalize(a.schoolName) } : {})
    }));

  if (admins.length === 0) {
    console.log("ℹ️  No admin data found to seed.");
    return;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const a of admins) {
    try {
      // Check if admin with this email already exists by searching all admins and decrypting
      const existingAdmins = await Admin.find({});
      let existingAdmin = null;
      
      for (const admin of existingAdmins) {
        try {
          // Try to decrypt admin data to compare emails
          const decryptedData = decryptAdminData(admin.toObject());
          if (decryptedData.email && decryptedData.email.toLowerCase() === a.email.toLowerCase()) {
            existingAdmin = admin;
            break;
          }
        } catch (error) {
          // If decryption fails, try direct comparison (for non-encrypted legacy data)
          if (admin.email && admin.email.toLowerCase() === a.email.toLowerCase()) {
            existingAdmin = admin;
            break;
          }
        }
      }

      // NOTE: Do NOT hash the password here. The Admin model's pre-save
      // middleware already handles hashing. Hashing here would cause a
      // double-hash, making password comparison always fail.
      const doc = {
        email: a.email,
        firstName: a.firstName,
        lastName: a.lastName,
        password: a.password, // plain text — will be hashed by pre-save hook
        role: "Admin",
        status: "Active",
        // ...(a.schoolName ? { schoolName: a.schoolName } : {})
      };

      if (existingAdmin) {
        // Admin exists, check if needs encryption update
        if (!isEncrypted(existingAdmin.email)) {
          console.log(`🔄 Updating admin ${a.email} to encrypted format...`);
          // For updates via findByIdAndUpdate, pre-save doesn't run,
          // so we must hash the password manually here.
          const hashed = await bcrypt.hash(a.password, 12);
          const updateDoc = { ...doc, password: hashed };
          const encryptedDoc = encryptAdminData(updateDoc);
          await Admin.findByIdAndUpdate(existingAdmin._id, encryptedDoc);
          updated++;
        } else {
          console.log(`⏭️  Admin ${a.email} already exists and is encrypted, skipping...`);
          skipped++;
        }
      } else {
        // Create new admin with encrypted data
        // Encrypt everything except password (model pre-save will hash it)
        console.log(`➕ Creating new encrypted admin ${a.email}...`);
        const encryptedDoc = encryptAdminData(doc);
        await Admin.create(encryptedDoc);
        created++;
      }
    } catch (error) {
      console.error(`❌ Error processing admin ${a.email}:`, error.message);
    }
  }

  console.log(`✅ Admin seeding complete. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
};

export default seedAdminAccounts;
