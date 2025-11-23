import Student from "../models/student.js";
import Instructor from "../models/instructor.js";
import Admin from "../models/admin.js";
import { decryptAdminData, decryptInstructorData, decryptStudentData } from "../controller/decryptionController.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
// const LOCK_TIME = 2 * 1000; // 2 seconds in milliseconds

// Helper function to get user model based on type
const getUserModel = (userType) => {
  switch (userType) {
    case 'student':
      return Student;
    case 'instructor':
      return Instructor;
    case 'admin':
      return Admin;
    default:
      throw new Error('Invalid user type');
  }
};

// Helper function to get decrypt function based on type
const getDecryptFunction = (userType) => {
  switch (userType) {
    case 'student':
      return decryptStudentData;
    case 'instructor':
      return decryptInstructorData;
    case 'admin':
      return decryptAdminData;
    default:
      throw new Error('Invalid user type');
  }
};

// Helper function to find user by decrypted email
const findUserByEmail = async (email, userType) => {
  const UserModel = getUserModel(userType);
  const decryptFn = getDecryptFunction(userType);
  
  // Fetch all users and decrypt to find match
  const users = await UserModel.find({});
  for (const user of users) {
    try {
      const decrypted = decryptFn(user.toObject());
      if (decrypted.email && decrypted.email.toLowerCase() === email.toLowerCase()) {
        return user; // Return the Mongoose document for updates
      }
    } catch (error) {
      console.warn(`Failed to decrypt user ${user._id}:`, error.message);
      continue;
    }
  }
  return null;
};

// Check if account is locked
export const isAccountLocked = (user) => {
  return user.accountLockedUntil && user.accountLockedUntil > Date.now();
};

// Handle failed login attempt
export const handleFailedLogin = async (email, userType) => {
  try {
    const user = await findUserByEmail(email, userType);
    
    if (!user) {
      return { locked: false };
    }

    // If previous lock has expired, reset attempts
    if (user.accountLockedUntil && user.accountLockedUntil < Date.now()) {
      user.accountLockedUntil = undefined;
      user.failedLoginAttempts = 1;
      user.lastFailedLogin = new Date();
      await user.save();
      return { locked: false, attempts: 1 };
    }

    // Increment failed attempts
    const newAttempts = (user.failedLoginAttempts || 0) + 1;
    user.failedLoginAttempts = newAttempts;
    user.lastFailedLogin = new Date();

    // Lock account if max attempts reached
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      user.accountLockedUntil = new Date(Date.now() + LOCK_TIME);
    }

    await user.save();

    return {
      locked: newAttempts >= MAX_FAILED_ATTEMPTS,
      attempts: newAttempts,
      lockUntil: user.accountLockedUntil,
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - newAttempts)
    };
  } catch (error) {
    console.error('Error handling failed login:', error);
    throw error;
  }
};

// Handle successful login (reset failed attempts)
export const handleSuccessfulLogin = async (email, userType) => {
  try {
    const user = await findUserByEmail(email, userType);
    
    if (user) {
      user.failedLoginAttempts = undefined;
      user.accountLockedUntil = undefined;
      user.lastFailedLogin = undefined;
      user.lastLogin = new Date();
      await user.save();
    }
  } catch (error) {
    console.error('Error handling successful login:', error);
    throw error;
  }
};

// Check account status before login
export const checkAccountStatus = async (email, userType) => {
  try {
    const user = await findUserByEmail(email, userType);
    
    if (!user) {
      return { exists: false };
    }

    const locked = isAccountLocked(user);
    const timeUntilUnlock = locked ? user.accountLockedUntil - Date.now() : 0;
    
    return {
      exists: true,
      locked,
      timeUntilUnlock,
      failedAttempts: user.failedLoginAttempts || 0,
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - (user.failedLoginAttempts || 0))
    };
  } catch (error) {
    console.error('Error checking account status:', error);
    throw error;
  }
};

// Middleware to check brute force protection
export const bruteForceProtection = async (req, res, next) => {
  try {
    const { email, userType, password } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        message: 'Email is required' 
      });
    }

    // For admin login, we infer userType from the presence of password field
    let inferredUserType = userType;
    if (!userType && password) {
      inferredUserType = 'admin'; // Admin login has password field
    } else if (!userType) {
      return res.status(400).json({ 
        message: 'User type is required' 
      });
    }

    const accountStatus = await checkAccountStatus(email, inferredUserType);
    
    if (!accountStatus.exists) {
      return next(); // Let the login handler deal with non-existent accounts
    }

    if (accountStatus.locked) {
      const hoursRemaining = Math.ceil(accountStatus.timeUntilUnlock / (60 * 60 * 1000));
      const minutesRemaining = Math.ceil(accountStatus.timeUntilUnlock / (60 * 1000));
      
      let timeMessage;
      if (hoursRemaining >= 1) {
        timeMessage = `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}`;
      } else {
        timeMessage = `${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}`;
      }

      return res.status(423).json({ 
        message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${timeMessage}.`,
        locked: true,
        timeUntilUnlock: accountStatus.timeUntilUnlock,
        failedAttempts: accountStatus.failedAttempts
      });
    }

    // Add account status and inferred user type to request for use in login handlers
    req.accountStatus = accountStatus;
    req.inferredUserType = inferredUserType;
    next();
  } catch (error) {
    console.error('Brute force protection error:', error);
    res.status(500).json({ 
      message: 'Internal server error during security check' 
    });
  }
};

export default {
  bruteForceProtection,
  handleFailedLogin,
  handleSuccessfulLogin,
  checkAccountStatus,
  isAccountLocked
};