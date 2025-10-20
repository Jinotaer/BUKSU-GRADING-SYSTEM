import Admin from '../models/admin.js';

const seedAdminAccount = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'admin@buksu.edu.ph' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin account already exists');
      return;
    }

    // Create default admin account
    const adminData = {
      email: process.env.ADMIN_EMAIL || 'admin@buksu.edu.ph',
      password: process.env.ADMIN_PASSWORD || 'admin123456',
      firstName: process.env.ADMIN_FIRST_NAME || 'System',
      lastName: process.env.ADMIN_LAST_NAME || 'Administrator'
    };

    const admin = new Admin(adminData);
    await admin.save();

    console.log('✅ Default admin account created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('⚠️  Please change the default password after first login.');
  } catch (error) {
    console.error('❌ Error creating default admin account:', error.message);
  }
};

export default seedAdminAccount;