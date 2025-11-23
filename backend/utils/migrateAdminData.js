// utils/migrateAdminData.js
import Admin from "../models/admin.js";
import { encryptAdminData } from "../controller/encryptionController.js";
import { decryptAdminData, isEncrypted } from "../controller/decryptionController.js";

/**
 * Migrate existing admin data to encrypted format
 * This script should be run once to encrypt existing admin accounts
 */
const migrateAdminData = async () => {
  try {
    console.log("🔄 Starting admin data migration to encrypted format...");
    
    const admins = await Admin.find({});
    console.log(`📊 Found ${admins.length} admin accounts to process`);
    
    let migrated = 0;
    let alreadyEncrypted = 0;
    let errors = 0;
    
    for (const admin of admins) {
      try {
        // Check if admin data is already encrypted
        if (isEncrypted(admin.email)) {
          console.log(`⏭️  Admin ${admin._id} already encrypted, skipping...`);
          alreadyEncrypted++;
          continue;
        }
        
        console.log(`🔐 Encrypting admin: ${admin.email}`);
        
        // Prepare admin data for encryption
        const adminData = {
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          // Keep other fields unchanged
          password: admin.password,
          role: admin.role,
          status: admin.status,
          lastLogin: admin.lastLogin,
          failedLoginAttempts: admin.failedLoginAttempts,
          accountLockedUntil: admin.accountLockedUntil,
          lastFailedLogin: admin.lastFailedLogin,
          createdAt: admin.createdAt
        };
        
        // Encrypt sensitive fields
        const encryptedData = encryptAdminData(adminData);
        
        // Update admin with encrypted data
        await Admin.findByIdAndUpdate(admin._id, encryptedData, { new: true });
        
        console.log(`✅ Successfully encrypted admin ${admin._id}`);
        migrated++;
        
      } catch (error) {
        console.error(`❌ Error migrating admin ${admin._id}:`, error.message);
        errors++;
      }
    }
    
    console.log("\n📋 Migration Summary:");
    console.log(`  ✅ Successfully migrated: ${migrated}`);
    console.log(`  ⏭️  Already encrypted: ${alreadyEncrypted}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log(`  📊 Total processed: ${admins.length}`);
    
    if (errors === 0) {
      console.log("🎉 Admin data migration completed successfully!");
    } else {
      console.log("⚠️  Migration completed with some errors. Please check the logs above.");
    }
    
  } catch (error) {
    console.error("💥 Fatal error during admin migration:", error);
    throw error;
  }
};

export default migrateAdminData;