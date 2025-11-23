import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Encryption configuration
const algorithm = "aes-256-cbc";
const secretKey = process.env.ENCRYPTION_SECRET_KEY || '12c64ab616476558cd1c101176c1cb8988d7fcdf2689f8511a2f69d3d822473e';
const ivLength = 16;

/**
 * Encrypts a given text using AES-256-CBC
 * @param {string} text - The text to encrypt
 * @returns {string} - Encrypted text in format "iv:encryptedData"
 */
const encrypt = (text) => {
  if (!text) return null;
  
  if (!secretKey) {
    console.error("Encryption secret key is not set");
    throw new Error("Encryption secret key is not set");
  }
  
  try {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, "hex"), iv);
    const encrypted = Buffer.concat([cipher.update(text.toString(), "utf8"), cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
};

/**
 * Encrypts sensitive fields in admin data
 * @param {Object} adminData - Admin object with sensitive fields
 * @returns {Object} - Admin object with encrypted sensitive fields
 */
const encryptAdminData = (adminData) => {
  if (!adminData) return null;
  
  const encryptedData = { ...adminData };
  
  // Encrypt sensitive fields for admin
  const sensitiveFields = ['email', 'firstName', 'lastName'];
  
  sensitiveFields.forEach(field => {
    if (encryptedData[field]) {
      encryptedData[field] = encrypt(encryptedData[field]);
    }
  });
  
  return encryptedData;
};

/**
 * Encrypts sensitive fields in instructor data
 * @param {Object} instructorData - Instructor object with sensitive fields
 * @returns {Object} - Instructor object with encrypted sensitive fields
 */
const encryptInstructorData = (instructorData) => {
  if (!instructorData) return null;
  
  const encryptedData = { ...instructorData };
  
  // Encrypt sensitive fields for instructor
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
    if (encryptedData[field]) {
      encryptedData[field] = encrypt(encryptedData[field]);
    }
  });
  
  return encryptedData;
};

/**
 * Encrypts sensitive fields in student data
 * @param {Object} studentData - Student object with sensitive fields
 * @returns {Object} - Student object with encrypted sensitive fields
 */
const encryptStudentData = (studentData) => {
  if (!studentData) return null;
  
  const encryptedData = { ...studentData };
  
  // Encrypt only the most sensitive fields for students
  // Keep college, course, yearLevel unencrypted for search/filter functionality
  const sensitiveFields = [
    'email',      // Most sensitive - contains PII
    'fullName',   // Personal identifier
    'studid',     // Student ID - sensitive identifier
    'googleId'    // Authentication identifier
  ];
  
  sensitiveFields.forEach(field => {
    if (encryptedData[field]) {
      encryptedData[field] = encrypt(encryptedData[field]);
    }
  });
  
  return encryptedData;
};

/**
 * Bulk encrypt user data based on user type
 * @param {Array} users - Array of user objects
 * @param {string} userType - Type of user ('admin', 'instructor', 'student')
 * @returns {Array} - Array of users with encrypted sensitive fields
 */
const bulkEncryptUserData = (users, userType) => {
  if (!users || !Array.isArray(users)) return [];
  
  return users.map(user => {
    switch (userType.toLowerCase()) {
      case 'admin':
        return encryptAdminData(user);
      case 'instructor':
        return encryptInstructorData(user);
      case 'student':
        return encryptStudentData(user);
      default:
        console.warn(`Unknown user type: ${userType}`);
        return user;
    }
  });
};

/**
 * Encrypts specific field value
 * @param {string} fieldName - Name of the field
 * @param {string} value - Value to encrypt
 * @returns {string} - Encrypted value
 */
const encryptField = (fieldName, value) => {
  if (!value) return null;
  
  console.log(`Encrypting field: ${fieldName}`);
  return encrypt(value);
};

/**
 * Express middleware to encrypt request data
 * @param {string} userType - Type of user data to encrypt
 */
const encryptionMiddleware = (userType) => {
  return (req, res, next) => {
    try {
      if (req.body) {
        switch (userType.toLowerCase()) {
          case 'admin':
            req.body = encryptAdminData(req.body);
            break;
          case 'instructor':
            req.body = encryptInstructorData(req.body);
            break;
          case 'student':
            req.body = encryptStudentData(req.body);
            break;
        }
      }
      next();
    } catch (error) {
      console.error('Encryption middleware error:', error);
      res.status(500).json({ error: 'Data encryption failed' });
    }
  };
};

export {
  encrypt,
  encryptAdminData,
  encryptInstructorData,
  encryptStudentData,
  bulkEncryptUserData,
  encryptField,
  encryptionMiddleware
};
