import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Decryption configuration
const algorithm = "aes-256-cbc";
const secretKey = process.env.ENCRYPTION_SECRET_KEY || '12c64ab616476558cd1c101176c1cb8988d7fcdf2689f8511a2f69d3d822473e';

/**
 * Decrypts a given encrypted text using AES-256-CBC
 * @param {string} encryptedText - The encrypted text in format "iv:encryptedData"
 * @returns {string} - Decrypted text
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  
  // Check if the text is in encrypted format (contains ":")
  if (!encryptedText.includes(":")) {
    // Not encrypted, return as is
    return encryptedText;
  }
  
  if (!secretKey) {
    console.error("Decryption secret key is not set");
    throw new Error("Decryption secret key is not set");
  }
  
  try {
    const [ivHex, encryptedHex] = encryptedText.split(":");
    
    if (!ivHex || !encryptedHex) {
      // Invalid format, return as is (might be plain text)
      return encryptedText;
    }
    
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, "hex"), iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    
    return decrypted.toString("utf8");
  } catch (error) {
    // If decryption fails, return the original value (might be plain text)
    console.warn("Decryption failed, returning original value:", error.message);
    return encryptedText;
  }
};

/**
 * Decrypts sensitive fields in admin data
 * @param {Object} adminData - Admin object with encrypted sensitive fields
 * @returns {Object} - Admin object with decrypted sensitive fields
 */
const decryptAdminData = (adminData) => {
  if (!adminData) return null;
  
  const decryptedData = { ...adminData };
  
  // Decrypt sensitive fields for admin
  const sensitiveFields = ['email', 'firstName', 'lastName'];
  
  sensitiveFields.forEach(field => {
    if (decryptedData[field]) {
      try {
        decryptedData[field] = decrypt(decryptedData[field]);
      } catch (error) {
        console.warn(`Failed to decrypt admin field ${field}:`, error.message);
        // Keep original value if decryption fails (might not be encrypted)
      }
    }
  });
  
  return decryptedData;
};

/**
 * Decrypts sensitive fields in instructor data
 * @param {Object} instructorData - Instructor object with encrypted sensitive fields
 * @returns {Object} - Instructor object with decrypted sensitive fields
 */
const decryptInstructorData = (instructorData) => {
  if (!instructorData) return null;
  
  const decryptedData = { ...instructorData };
  
  // Decrypt sensitive fields for instructor
  const sensitiveFields = [
    'email', 
    'fullName', 
    'instructorid',
    'college', 
    'department',
    'googleAccessToken',
    'googleRefreshToken'
  ];
  
  sensitiveFields.forEach(field => {
    if (decryptedData[field]) {
      try {
        decryptedData[field] = decrypt(decryptedData[field]);
      } catch (error) {
        console.warn(`Failed to decrypt instructor field ${field}:`, error.message);
        // Keep original value if decryption fails (might not be encrypted)
      }
    }
  });
  
  return decryptedData;
};

/**
 * Decrypts sensitive fields in student data
 * @param {Object} studentData - Student object with encrypted sensitive fields
 * @returns {Object} - Student object with decrypted sensitive fields
 */
const decryptStudentData = (studentData) => {
  if (!studentData) return null;
  
  const decryptedData = { ...studentData };
  
  // Decrypt fields that might be encrypted
  // Note: college, course, yearLevel should ideally remain unencrypted for search/filter,
  // but we'll attempt to decrypt them in case they were encrypted in an earlier version
  const sensitiveFields = [
    'email',      // Encrypted for privacy
    'fullName',   // Encrypted personal identifier
    'studid',     // Encrypted student ID
    'googleId',   // Encrypted authentication identifier
    'college',    // May be encrypted in legacy data
    'course',     // May be encrypted in legacy data
    'yearLevel'   // May be encrypted in legacy data
  ];
  
  sensitiveFields.forEach(field => {
    if (decryptedData[field]) {
      try {
        const decryptedValue = decrypt(decryptedData[field]);
        decryptedData[field] = decryptedValue;
      } catch (error) {
        // If error occurs, keep the original value (likely plain text)
        console.debug(`Keeping original value for student field ${field}`);
      }
    }
  });
  
  return decryptedData;
};

/**
 * Bulk decrypt user data based on user type
 * @param {Array} users - Array of user objects with encrypted fields
 * @param {string} userType - Type of user ('admin', 'instructor', 'student')
 * @returns {Array} - Array of users with decrypted sensitive fields
 */
const bulkDecryptUserData = (users, userType) => {
  if (!users || !Array.isArray(users)) return [];
  
  return users.map(user => {
    switch (userType.toLowerCase()) {
      case 'admin':
        return decryptAdminData(user);
      case 'instructor':
        return decryptInstructorData(user);
      case 'student':
        return decryptStudentData(user);
      default:
        console.warn(`Unknown user type: ${userType}`);
        return user;
    }
  });
};

/**
 * Decrypts specific field value
 * @param {string} fieldName - Name of the field
 * @param {string} encryptedValue - Encrypted value to decrypt
 * @returns {string} - Decrypted value
 */
const decryptField = (fieldName, encryptedValue) => {
  if (!encryptedValue) return null;
  
  try {
    console.log(`Decrypting field: ${fieldName}`);
    return decrypt(encryptedValue);
  } catch (error) {
    console.warn(`Failed to decrypt field ${fieldName}:`, error.message);
    return encryptedValue; // Return original if decryption fails
  }
};

/**
 * Express middleware to decrypt response data
 * @param {string} userType - Type of user data to decrypt
 */
const decryptionMiddleware = (userType) => {
  return (req, res, next) => {
    try {
      // Store original send method
      const originalSend = res.send;
      
      // Override send method to decrypt data before sending
      res.send = function(data) {
        try {
          if (data && typeof data === 'object') {
            let parsedData = data;
            
            // If data is a string, try to parse it
            if (typeof data === 'string') {
              try {
                parsedData = JSON.parse(data);
              } catch (e) {
                // If parsing fails, send original data
                return originalSend.call(this, data);
              }
            }
            
            // Decrypt based on data structure
            if (Array.isArray(parsedData)) {
              parsedData = bulkDecryptUserData(parsedData, userType);
            } else if (parsedData.data && Array.isArray(parsedData.data)) {
              parsedData.data = bulkDecryptUserData(parsedData.data, userType);
            } else {
              // Single user object
              switch (userType.toLowerCase()) {
                case 'admin':
                  parsedData = decryptAdminData(parsedData);
                  break;
                case 'instructor':
                  parsedData = decryptInstructorData(parsedData);
                  break;
                case 'student':
                  parsedData = decryptStudentData(parsedData);
                  break;
              }
            }
            
            return originalSend.call(this, JSON.stringify(parsedData));
          }
          
          return originalSend.call(this, data);
        } catch (error) {
          console.error('Decryption middleware error:', error);
          return originalSend.call(this, data); // Send original data if decryption fails
        }
      };
      
      next();
    } catch (error) {
      console.error('Decryption middleware setup error:', error);
      next();
    }
  };
};

/**
 * Safely decrypt data with fallback to original value
 * @param {string} encryptedData - Encrypted data
 * @returns {string} - Decrypted data or original if decryption fails
 */
const safeDecrypt = (encryptedData) => {
  try {
    return decrypt(encryptedData);
  } catch (error) {
    console.warn('Safe decrypt failed, returning original value:', error.message);
    return encryptedData;
  }
};

/**
 * Check if a string appears to be encrypted (contains colon separator)
 * @param {string} value - Value to check
 * @returns {boolean} - True if appears encrypted
 */
const isEncrypted = (value) => {
  if (!value || typeof value !== 'string') return false;
  return value.includes(':') && value.split(':').length === 2;
};

export {
  decrypt,
  decryptAdminData,
  decryptInstructorData,
  decryptStudentData,
  bulkDecryptUserData,
  decryptField,
  decryptionMiddleware,
  safeDecrypt,
  isEncrypted
};
