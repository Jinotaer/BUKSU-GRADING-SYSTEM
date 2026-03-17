import mongoose from 'mongoose';
import Student from "../models/student.js";
import Instructor from "../models/instructor.js";
import Admin from "../models/admin.js";
import { decryptAdminData, decryptInstructorData, decryptStudentData } from "../controller/decryptionController.js";
import { logRequestSecurityEvent } from "../utils/activityLogUtils.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
// const LOCK_TIME = 2 * 1000; // 2 seconds in milliseconds
const SUPPORTED_USER_TYPES = ['student', 'instructor', 'admin'];

const getTargetType = (userType) => {
  if (userType === "admin") return "Admin";
  if (userType === "instructor") return "Instructor";
  if (userType === "student") return "Student";
  return "System";
};

const resolveSearchTypes = (userType) => {
  if (!userType) {
    return SUPPORTED_USER_TYPES;
  }

  return SUPPORTED_USER_TYPES.includes(userType) ? [userType] : [];
};

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
  // If DB is not connected, skip DB-dependent checks to avoid crashing the login flow
  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    console.warn('Database not connected; skipping brute-force user lookup');
    return null;
  }

  const searchTypes = resolveSearchTypes(userType);

  for (const type of searchTypes) {
    const UserModel = getUserModel(type);
    const decryptFn = getDecryptFunction(type);
    const users = await UserModel.find({});

    for (const user of users) {
      try {
        const decrypted = decryptFn(user.toObject());
        if (decrypted.email && decrypted.email.toLowerCase() === email.toLowerCase()) {
          return { user, userType: type };
        }
      } catch (error) {
        console.warn(`Failed to decrypt ${type} ${user._id}:`, error.message);
        continue;
      }
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
    const userResult = await findUserByEmail(email, userType);
    
    if (!userResult?.user) {
      return { locked: false };
    }

    const { user } = userResult;

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
    const userResult = await findUserByEmail(email, userType);
    
    if (userResult?.user) {
      const { user } = userResult;
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
    const userResult = await findUserByEmail(email, userType);
    
    if (!userResult?.user) {
      return { exists: false };
    }

    const { user, userType: resolvedUserType } = userResult;

    const locked = isAccountLocked(user);
    const timeUntilUnlock = locked ? user.accountLockedUntil - Date.now() : 0;
    
    return {
      exists: true,
      userType: resolvedUserType,
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
      logRequestSecurityEvent({
        req,
        res,
        action: "SECURITY_VIOLATION",
        description: "Blocked malformed login request with no email address",
        statusCode: 400,
        errorMessage: "Email is required",
        metadata: {
          violationType: "missing_email",
          securityLayer: "brute_force_protection",
        },
      }).catch(() => {});

      return res.status(400).json({ 
        message: 'Email is required' 
      });
    }

    // For admin login, we infer userType from the presence of password field.
    // Passwordless Google login may omit userType so the login handler can
    // resolve ambiguous institutional domains.
    let inferredUserType = userType;
    if (!userType && password) {
      inferredUserType = 'admin'; // Admin login has password field
    }

    const accountStatus = await checkAccountStatus(email, inferredUserType);
    const resolvedUserType = accountStatus.userType || inferredUserType;
    
    if (!accountStatus.exists) {
      req.accountStatus = accountStatus;
      req.inferredUserType = inferredUserType;
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

      logRequestSecurityEvent({
        req,
        res,
        action: "ACCOUNT_LOCKED",
        description: `Blocked login for locked ${inferredUserType} account ${email.toLowerCase()}`,
        statusCode: 423,
        errorMessage: "Account is temporarily locked",
        actorOverride: {
          attemptedEmail: email.toLowerCase(),
          attemptedUserType: resolvedUserType,
        },
        targetInfo: {
          targetType: getTargetType(resolvedUserType),
          targetIdentifier: email.toLowerCase(),
        },
        metadata: {
          securityLayer: "brute_force_protection",
          resolvedUserType,
          failedAttempts: accountStatus.failedAttempts,
          remainingAttempts: accountStatus.remainingAttempts,
          timeUntilUnlockMs: accountStatus.timeUntilUnlock,
        },
      }).catch(() => {});

      return res.status(423).json({ 
        message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${timeMessage}.`,
        locked: true,
        timeUntilUnlock: accountStatus.timeUntilUnlock,
        failedAttempts: accountStatus.failedAttempts
      });
    }

    // Add account status and inferred user type to request for use in login handlers
    req.accountStatus = accountStatus;
    req.inferredUserType = resolvedUserType || inferredUserType;
    next();
  } catch (error) {
    console.error('Brute force protection error:', error);
    logRequestSecurityEvent({
      req,
      res,
      action: "SECURITY_VIOLATION",
      description: "Brute-force protection middleware failed",
      statusCode: 500,
      errorMessage: error.message,
      metadata: {
        securityLayer: "brute_force_protection",
      },
    }).catch(() => {});

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
