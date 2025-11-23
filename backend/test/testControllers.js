// Test the actual controller files
import dotenv from 'dotenv';
dotenv.config();

// Test importing the controllers
console.log('🔄 Testing Controller Imports...');

try {
  const encryptionModule = await import('../controller/encryptionController.js');
  console.log('✅ Encryption controller imported successfully');
  console.log('Available functions:', Object.keys(encryptionModule));
  
  const decryptionModule = await import('../controller/decryptionController.js');
  console.log('✅ Decryption controller imported successfully');
  console.log('Available functions:', Object.keys(decryptionModule));
  
  const utilsModule = await import('../utils/userCryptoUtils.js');
  console.log('✅ UserCryptoUtils imported successfully');
  console.log('Available methods:', Object.getOwnPropertyNames(utilsModule.default));

  // Test actual functions
  console.log('\n🧪 Testing Actual Functions...');
  
  const { encrypt, encryptAdminData } = encryptionModule;
  const { decrypt, decryptAdminData } = decryptionModule;
  const UserCryptoUtils = utilsModule.default;
  
  // Basic test
  const testData = "Test sensitive data";
  const encrypted = encrypt(testData);
  const decrypted = decrypt(encrypted);
  
  console.log('Basic function test:', testData === decrypted ? '✅ PASS' : '❌ FAIL');
  
  // Admin data test
  const adminData = { email: 'admin@test.com', firstName: 'Test', lastName: 'Admin' };
  const encryptedAdmin = encryptAdminData(adminData);
  const decryptedAdmin = decryptAdminData(encryptedAdmin);
  
  console.log('Admin data test:', adminData.email === decryptedAdmin.email ? '✅ PASS' : '❌ FAIL');
  
  // Utils test
  const utilsEncrypted = UserCryptoUtils.encryptUserData(adminData, 'admin');
  const utilsDecrypted = UserCryptoUtils.decryptUserData(utilsEncrypted, 'admin');
  
  console.log('Utils test:', adminData.email === utilsDecrypted.email ? '✅ PASS' : '❌ FAIL');
  
  console.log('\n🎉 All controller tests completed successfully!');
  
} catch (error) {
  console.error('❌ Controller test failed:', error.message);
  console.error('Stack:', error.stack);
}