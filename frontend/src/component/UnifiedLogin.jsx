import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import buksuLogo from "../assets/logo1.png";
import landingPageBg from "../assets/landingpage1.png"; 
import { useNotifications } from "../hooks/useNotifications"; 
import { NotificationProvider } from "./common/NotificationModals";
import adminAuth from "../utils/adminAuth";
import {
  GoogleLoginButton,
  LoginWelcomeHeader,
  Divider,
  LoginFormContainer,
  BrandPanel,
  CaptchaSection,
  ErrorMessage,
  ForgotPasswordLink,
} from "./ui/login";

const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

if (!recaptchaKey) {
  console.error('VITE_RECAPTCHA_SITE_KEY environment variable is not set');
}

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { showConfirmDialog, showError, showSuccess } = notifications;
  
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [error, setError] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("student");
  const [loginMethod, setLoginMethod] = useState("google"); // 'google' or 'email'
  const [isLoading, setIsLoading] = useState(false);

  // Form fields for email/password login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const getUserTypeFromEmail = (email) => {
    if (email.endsWith('@student.buksu.edu.ph')) {
      return 'student';
    } else if (email.endsWith('@gmail.com')) {
      return 'instructor';
    }
    return null;
  };

  const getRedirectPath = (userType) => {
    switch (userType) {
      case 'student':
        return '/student';
      case 'instructor':
        return '/instructor';
      case 'admin':
        return '/admin';
      default:
        return '/login';
    }
  };

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!recaptchaValue) {
      setError("Please complete the reCAPTCHA.");
      setIsLoading(false);
      return;
    }

    if (!email || !password) {
      setError("Please enter both email and password.");
      setIsLoading(false);
      return;
    }

    try {
      // Handle admin login separately
      if (selectedUserType === 'admin') {
        const data = await adminAuth.login(email, password, recaptchaValue);
        if (data.success) {
          sessionStorage.setItem("accessToken", data.tokens.accessToken);
          sessionStorage.setItem("userType", "Admin");
          sessionStorage.setItem("adminInfo", JSON.stringify(data.admin));
          showSuccess("Admin login successful!", "Welcome");
          navigate("/admin");
        } else {
          setError(data.message || "Admin login failed.");
        }
      } else {
        // Handle student/instructor login
        const response = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            userType: selectedUserType,
            captchaResponse: recaptchaValue,
            loginMethod: 'email'
          }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          sessionStorage.setItem("accessToken", data.token);
          sessionStorage.setItem("userInfo", JSON.stringify(data.user));
          sessionStorage.setItem("userType", selectedUserType);
          showSuccess(`${selectedUserType.charAt(0).toUpperCase() + selectedUserType.slice(1)} login successful!`, "Welcome");
          navigate(getRedirectPath(selectedUserType));
        } else {
          handleLoginError(response, data);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response && selectedUserType === 'admin') {
        const errorData = error.response;
        if (error.response.status === 423) {
          setError(errorData.message || "Account is temporarily locked due to too many failed login attempts.");
        } else {
          let errorMessage = errorData.message || "Login failed.";
          if (errorData.remainingAttempts !== undefined && errorData.remainingAttempts > 0) {
            errorMessage += ` ${errorData.remainingAttempts} attempt${errorData.remainingAttempts > 1 ? "s" : ""} remaining.`;
          }
          setError(errorMessage);
        }
      } else {
        setError("An error occurred while logging in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      setError("");
      setIsLoading(true);
      
      if (!recaptchaValue) {
        setError("Please complete the reCAPTCHA.");
        setIsLoading(false);
        return;
      }

      try {
        // Get user email from Google
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${credentialResponse.access_token}`,
            },
          }
        );
        const userInfo = await userInfoRes.json();
        const userEmail = userInfo.email;

        // Auto-detect user type from email if not admin
        let userType = selectedUserType;
        if (selectedUserType !== 'admin') {
          const detectedType = getUserTypeFromEmail(userEmail);
          if (detectedType) {
            userType = detectedType;
          } else {
            setError("Please use your institutional email account for student/instructor login, or select admin and use email/password login.");
            setIsLoading(false);
            return;
          }
        } else {
          setError("Admin accounts do not support Google authentication. Please use email and password.");
          setIsLoading(false);
          return;
        }

        // Call backend to check registration/approval
        const response = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: userEmail,
            userType: userType,
            captchaResponse: recaptchaValue,
            loginMethod: 'google'
          }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          sessionStorage.setItem("authToken", credentialResponse.access_token);
          sessionStorage.setItem("userInfo", JSON.stringify(data.user));
          sessionStorage.setItem("accessToken", data.token);
          sessionStorage.setItem("userType", userType);
          showSuccess(`${userType.charAt(0).toUpperCase() + userType.slice(1)} login successful!`, "Welcome");
          navigate(getRedirectPath(userType));
        } else {
          handleLoginError(response, data, userType, userEmail);
        }
      } catch (error) {
        console.error("Google login error:", error);
        setError("An error occurred while logging in with Google.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError("Google login failed. Please try again.");
      setIsLoading(false);
    },
  });

  const handleLoginError = (response, data, userType = selectedUserType, email = null) => {
    // Handle account locked (HTTP 423)
    if (response.status === 423) {
      showError(
        data.message || "Account is temporarily locked due to too many failed login attempts.",
        "Account Locked"
      );
      return;
    }
    
    // Handle unregistered students
    if (data.message === "Student not registered" && userType === 'student') {
      showConfirmDialog(
        "Account Not Found",
        `No account found for ${email || "this email"}. Would you like to create a new student account?`,
        () => {
          navigate("/studentRegister", { state: { email: email || "" } });
        }
      );
      return;
    }
    
    // Handle unregistered instructors
    if (data.message === "Instructor not registered" && userType === 'instructor') {
      showError("Please wait for admin invitation to access the system.", "Access Denied");
      return;
    }
    
    // Handle pending approval
    if (data.message === "Account not approved yet") {
      showError(
        "Your account is pending admin approval. Please check your email.",
        "Account Pending"
      );
      return;
    }
    
    // Handle other login failures with remaining attempts info
    let errorMessage = data.message || "Login failed.";
    if (data.remainingAttempts !== undefined && data.remainingAttempts > 0) {
      errorMessage += ` ${data.remainingAttempts} attempt${data.remainingAttempts > 1 ? 's' : ''} remaining.`;
    }
    
    showError(errorMessage, "Login Failed");
  };

  const onRecaptchaChange = (value) => setRecaptchaValue(value);

  const handleForgotPassword = () => {
    navigate("/forgotPassword", { 
      state: { 
        userType: selectedUserType,
        email: email 
      } 
    });
  };

  return (
    <NotificationProvider notifications={notifications}>
      <div className="flex min-h-screen lg:flex-row flex-col">
        {/* Left Panel - Background Image */}
        <BrandPanel
          logoSrc={buksuLogo}
          backgroundSrc={landingPageBg}
          title="BUKSU GRADING SYSTEM"
        />

        {/* Right Panel - Login Form */}
        <LoginFormContainer>
          <LoginWelcomeHeader
            title="Welcome to BUKSU Grading System"
            subtitle="Sign in to access your account"
          />

          {/* User Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Account Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['student', 'instructor', 'admin'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setSelectedUserType(type);
                    setError("");
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    selectedUserType === type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Login Method Selection */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("google");
                  setError("");
                }}
                disabled={selectedUserType === 'admin'}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  loginMethod === "google" && selectedUserType !== 'admin'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : selectedUserType === 'admin'
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Google Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("email");
                  setError("");
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  loginMethod === "email"
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Email & Password
              </button>
            </div>
            {selectedUserType === 'admin' && loginMethod === 'google' && (
              <p className="text-xs text-gray-500 mt-2">
                Admin accounts require email and password authentication
              </p>
            )}
          </div>

          {/* Login Forms */}
          {loginMethod === "email" ? (
            <form onSubmit={handleEmailPasswordLogin} className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={`Enter your ${selectedUserType} email`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? "Signing in..." : `Sign in as ${selectedUserType.charAt(0).toUpperCase() + selectedUserType.slice(1)}`}
              </button>
            </form>
          ) : (
            <div className="mb-6">
              {selectedUserType === 'admin' ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-amber-800 text-sm">
                    Admin accounts do not support Google authentication. Please use email and password login.
                  </p>
                </div>
              ) : (
                <GoogleLoginButton 
                  onClick={() => login()} 
                  disabled={isLoading}
                  loading={isLoading}
                />
              )}
            </div>
          )}

          {/* Forgot Password Link */}
          <ForgotPasswordLink onClick={handleForgotPassword} />

          {/* Divider - only show if both methods are available */}
          {selectedUserType !== 'admin' && <Divider />}

          {/* Alternative Login Method */}
          {selectedUserType !== 'admin' && loginMethod === "email" && (
            <div className="mb-6">
              <GoogleLoginButton 
                onClick={() => login()} 
                disabled={isLoading}
                loading={isLoading}
              />
            </div>
          )}

          {selectedUserType !== 'admin' && loginMethod === "google" && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setLoginMethod("email")}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Use Email & Password Instead
              </button>
            </div>
          )}

          {/* reCAPTCHA */}
          <CaptchaSection
            sitekey={recaptchaKey}
            onChange={onRecaptchaChange}
            onExpired={() => setRecaptchaValue(null)}
            onErrored={() => setRecaptchaValue(null)}
          />

          {/* Error message */}
          <ErrorMessage message={error} />

          {/* Helper Text */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <div className="space-y-1">
              <p>
                <span className="font-medium">Students:</span> Use @student.buksu.edu.ph email
              </p>
              <p>
                <span className="font-medium">Instructors:</span> Use approved @gmail.com email
              </p>
              <p>
                <span className="font-medium">Admins:</span> Use email & password only
              </p>
            </div>
          </div>
        </LoginFormContainer>
      </div>
    </NotificationProvider>
  );
}