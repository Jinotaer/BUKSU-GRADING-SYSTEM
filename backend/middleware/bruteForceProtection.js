import Student from "../models/student.js";
import Instructor from "../models/instructor.js";
import Admin from "../models/admin.js";

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

// Check if account is locked
export const isAccountLocked = (user) => {
  return user.accountLockedUntil && user.accountLockedUntil > Date.now();
};

// Handle failed login attempt
export const handleFailedLogin = async (email, userType) => {
  try {
    const UserModel = getUserModel(userType);
    const user = await UserModel.findOne({ email });
    
    if (!user) {
      return { locked: false };
    }

    // If previous lock has expired, reset attempts
    if (user.accountLockedUntil && user.accountLockedUntil < Date.now()) {
      await UserModel.updateOne(
        { email },
        {
          $unset: { accountLockedUntil: 1 },
          $set: { 
            failedLoginAttempts: 1,
            lastFailedLogin: new Date()
          }
        }
      );
      return { locked: false, attempts: 1 };
    }

    // Increment failed attempts
    const newAttempts = (user.failedLoginAttempts || 0) + 1;
    const updates = {
      failedLoginAttempts: newAttempts,
      lastFailedLogin: new Date()
    };

    // Lock account if max attempts reached
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      updates.accountLockedUntil = new Date(Date.now() + LOCK_TIME);
    }

    await UserModel.updateOne({ email }, { $set: updates });

    return {
      locked: newAttempts >= MAX_FAILED_ATTEMPTS,
      attempts: newAttempts,
      lockUntil: updates.accountLockedUntil,
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
    const UserModel = getUserModel(userType);
    await UserModel.updateOne(
      { email },
      {
        $unset: { 
          failedLoginAttempts: 1, 
          accountLockedUntil: 1, 
          lastFailedLogin: 1 
        },
        $set: { lastLogin: new Date() }
      }
    );
  } catch (error) {
    console.error('Error handling successful login:', error);
    throw error;
  }
};

// Check account status before login
export const checkAccountStatus = async (email, userType) => {
  try {
    const UserModel = getUserModel(userType);
    const user = await UserModel.findOne({ email });
    
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