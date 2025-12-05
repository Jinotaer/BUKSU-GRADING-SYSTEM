import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import buksuLogo from "../assets/logo1.png";
import landingPageBg from "../assets/landingpage1.png"; 
import { useNotifications } from "../hooks/useNotifications"; 
import { NotificationProvider } from "./common/NotificationModals";
import {
  GoogleLoginButton,
  LoginWelcomeHeader,
  AdminLoginLink,
  Divider,
  LoginFormContainer,
  BrandPanel,
  CaptchaSection,
  ErrorMessage,
  LoginForm,
  ForgotPasswordLink,
} from "./ui/login";

const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || 6Ld3NiEsAAAAAICG9oNYX77QFtEQhtqODzPIONoB;

if (!recaptchaKey) {
  console.error('VITE_RECAPTCHA_SITE_KEY environment variable is not set');
}

export default function Login() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { showConfirmDialog, showError } = notifications;
  
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [error, setError] = useState("");

  // Helper function to validate email domains (but not determine user type)
  const isValidInstitutionalEmail = (email) => {
    return email.endsWith('@student.buksu.edu.ph') || 
           email.endsWith('@buksu.edu.ph') ||
           email.endsWith('@gmail.com'); // For testing
  };

  // Handle email/password login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!recaptchaValue) {
      setError("Please complete the reCAPTCHA.");
      return;
    }

    const email = e.target.email.value;
    const password = e.target.adminPassword.value;

    if (!isValidInstitutionalEmail(email)) {
      setError("Please use a valid institutional email address.");
      return;
    }

    try {
      // First, let the backend determine the user type by checking the database
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email,
          password,
          captchaResponse: recaptchaValue,
          loginMethod: 'email'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Get the user type from the backend response
        const userType = data.user.role;
        
        // Store authentication data
        sessionStorage.setItem("accessToken", data.token);
        sessionStorage.setItem("userType", userType);
        sessionStorage.setItem("userInfo", JSON.stringify(data.user));
        
        if (userType === 'admin') {
          sessionStorage.setItem("adminInfo", JSON.stringify(data.user));
        }

        // Navigate based on user type from backend
        switch (userType) {
          case 'student':
            navigate("/student");
            break;
          case 'instructor':
            navigate("/instructor");
            break;
          case 'admin':
            navigate("/admin");
            break;
          default:
            setError("Invalid user type");
        }
      } else {
        // Handle errors
        if (response.status === 423) {
          showError(
            data.message || "Account is temporarily locked due to too many failed login attempts.",
            "Account Locked"
          );
          return;
        }
        
        let errorMessage = data.message || "Login failed.";
        if (data.remainingAttempts !== undefined && data.remainingAttempts > 0) {
          errorMessage += ` ${data.remainingAttempts} attempt${data.remainingAttempts > 1 ? 's' : ''} remaining.`;
        }
        
        showError(errorMessage, "Login Failed");
      }
    } catch (error) {
      console.error("Email login error:", error);
      showError("An error occurred while logging in.", "Login Error");
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      console.log('Google OAuth success:', credentialResponse);
      console.log('reCAPTCHA value:', recaptchaValue);
      setError("");
      if (!recaptchaValue) {
        setError("Please complete the reCAPTCHA verification first.");
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

        // Validate email domain but let backend determine user type
        if (!isValidInstitutionalEmail(userEmail)) {
          setError("Please use your institutional email account.");
          return;
        }

        // Call backend to check registration and get actual user role
        const response = await fetch(
          "http://localhost:5000/api/auth/login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              email: userEmail,
              captchaResponse: recaptchaValue,
              loginMethod: 'google'
            }),
          }
        );
        
        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response data:', data);
        
        if (response.ok) {
          // Get the actual user type from backend response
          const userType = data.user.role;
          
          sessionStorage.setItem("authToken", credentialResponse.access_token);
          sessionStorage.setItem("userInfo", JSON.stringify(data.user));
          sessionStorage.setItem("accessToken", data.token);
          sessionStorage.setItem("userType", userType);
          
          if (userType === 'admin') {
            sessionStorage.setItem("adminInfo", JSON.stringify(data.user));
          }
          
          // Navigate based on user type from backend
          switch (userType) {
            case 'student':
              navigate("/student");
              break;
            case 'instructor':
              navigate("/instructor");
              break;
            case 'admin':
              navigate("/admin");
              break;
            default:
              setError("Invalid user type");
          }
        } else {
          console.error('Login failed:', response.status, data);
          // Handle account locked (HTTP 423)
          if (response.status === 423) {
            showError(
              data.message || "Account is temporarily locked due to too many failed login attempts.",
              "Account Locked"
            );
            return;
          }
          
          if (data.message === "Student not registered") {
            // Show confirmation dialog before proceeding to registration
            showConfirmDialog(
              "Account Not Found",
              `No account found for ${userEmail}. Would you like to create a new student account with this email?`,
              () => {
                navigate("/studentRegister", { state: { email: userEmail } });
              }
            );
            return;
          }
          if (data.message === "Instructor not registered") {
            showError("Please wait for admin invitation to access the system.", "Access Denied");
            return;
          }
          if (data.message === "Admin not registered") {
            showError("Admin account not found. Please contact system administrator.", "Access Denied");
            return;
          }
          if (data.message && data.message.includes("not registered")) {
            showError("Account not found. Please contact system administrator.", "Access Denied");
            return;
          }
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
        }
      } catch (error) {
        console.error("Google login error:", error);
        showError("An error occurred while logging in. Please try again.", "Login Error");
      }
    },
    onError: (error) => {
      console.error("Google OAuth error:", error);
      showError("Login failed. Please try again.", "Login Failed");
    },
    flow: 'auth-code', // Use authorization code flow instead of implicit
    ux_mode: 'popup' // Explicitly set popup mode
  });

  const onRecaptchaChange = (value) => setRecaptchaValue(value);

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
            title="Welcome back"
            subtitle="Sign in using your institutional account"
          />

          {/* Login Form */}
          <LoginForm onSubmit={handleEmailLogin} disabled={!recaptchaValue} />

          {/* Forgot Password Link */}
          <ForgotPasswordLink onClick={() => navigate("/forgotPassword")} to="/forgotPassword" />

          {/* Divider */}
          <Divider />

          {/* Google Login Button */}
          <GoogleLoginButton onClick={() => login()} disabled={!recaptchaValue} />
          
          {!recaptchaValue && (
            <p className="text-sm text-amber-600 text-center">
              ⚠️ Please complete reCAPTCHA verification to enable login options
            </p>
          )}

          {/* reCAPTCHA */}
          <CaptchaSection
            sitekey={recaptchaKey}
            onChange={onRecaptchaChange}
            onExpired={() => {}}
            onErrored={() => {}}
          />

          {/* Error message */}
          <ErrorMessage message={error} />
        </LoginFormContainer>
      </div>
    </NotificationProvider>
  );
}
