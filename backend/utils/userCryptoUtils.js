import { 
  encryptAdminData, 
  encryptInstructorData, 
  encryptStudentData 
} from '../controller/encryptionController.js';

import { 
  decryptAdminData, 
  decryptInstructorData, 
  decryptStudentData,
  safeDecrypt,
  isEncrypted
} from '../controller/decryptionController.js';

/**
 * Utility class for handling user data encryption/decryption
 */
class UserCryptoUtils {
  
  /**
   * Encrypt user data based on user type
   * @param {Object} userData - User data to encrypt
   * @param {string} userType - Type of user ('admin', 'instructor', 'student')
   * @returns {Object} - Encrypted user data
   */
  static encryptUserData(userData, userType) {
    if (!userData) return null;
    
    switch (userType.toLowerCase()) {
      case 'admin':
        return encryptAdminData(userData);
      case 'instructor':
        return encryptInstructorData(userData);
      case 'student':
        return encryptStudentData(userData);
      default:
        console.warn(`Unknown user type for encryption: ${userType}`);
        return userData;
    }
  }
  
  /**
   * Decrypt user data based on user type
   * @param {Object} userData - User data to decrypt
   * @param {string} userType - Type of user ('admin', 'instructor', 'student')
   * @returns {Object} - Decrypted user data
   */
  static decryptUserData(userData, userType) {
    if (!userData) return null;
    
    switch (userType.toLowerCase()) {
      case 'admin':
        return decryptAdminData(userData);
      case 'instructor':
        return decryptInstructorData(userData);
      case 'student':
        return decryptStudentData(userData);
      default:
        console.warn(`Unknown user type for decryption: ${userType}`);
        return userData;
    }
  }
  
  /**
   * Encrypt user data before saving to database
   * @param {Object} userData - User data to encrypt
   * @param {string} userType - Type of user
   * @returns {Object} - Encrypted user data ready for database
   */
  static prepareForDatabase(userData, userType) {
    const encryptedData = this.encryptUserData(userData, userType);
    console.log(`Prepared ${userType} data for database encryption`);
    return encryptedData;
  }
  
  /**
   * Decrypt user data after retrieving from database
   * @param {Object} userData - Encrypted user data from database
   * @param {string} userType - Type of user
   * @returns {Object} - Decrypted user data ready for use
   */
  static prepareFromDatabase(userData, userType) {
    const decryptedData = this.decryptUserData(userData, userType);
    console.log(`Prepared ${userType} data from database decryption`);
    return decryptedData;
  }
  
  /**
   * Safely decrypt a field with fallback
   * @param {string} encryptedValue - Encrypted field value
   * @returns {string} - Decrypted value or original if decryption fails
   */
  static safeDecryptField(encryptedValue) {
    return safeDecrypt(encryptedValue);
  }
  
  /**
   * Check if a value appears to be encrypted
   * @param {string} value - Value to check
   * @returns {boolean} - True if value appears encrypted
   */
  static isFieldEncrypted(value) {
    return isEncrypted(value);
  }
  
  /**
   * Encrypt array of users
   * @param {Array} users - Array of user objects
   * @param {string} userType - Type of users
   * @returns {Array} - Array of encrypted user objects
   */
  static encryptUserArray(users, userType) {
    if (!users || !Array.isArray(users)) return [];
    
    return users.map(user => this.encryptUserData(user, userType));
  }
  
  /**
   * Decrypt array of users
   * @param {Array} users - Array of encrypted user objects
   * @param {string} userType - Type of users
   * @returns {Array} - Array of decrypted user objects
   */
  static decryptUserArray(users, userType) {
    if (!users || !Array.isArray(users)) return [];
    
    return users.map(user => this.decryptUserData(user, userType));
  }
}

export default UserCryptoUtils;