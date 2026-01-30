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
} from "./ui/login";

const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6Ld3NiEsAAAAAICG9oNYX77QFtEQhtqODzPIONoB";

if (!recaptchaKey) {
  console.error('VITE_RECAPTCHA_SITE_KEY environment variable is not set');
}

export default function Login() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const { showConfirmDialog, showError } = notifications;
  
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [error, setError] = useState("");

  const login = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      setError("");
      if (!recaptchaValue) {
         setError("Please complete the reCAPTCHA.");
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

        // Check email domain to determine user type
        const isStudent = userEmail.endsWith('@student.buksu.edu.ph');
        const isInstructor = userEmail.endsWith('@gmail.com');

        if (!isStudent && !isInstructor) {
          setError("Please use your Buksu institutional email account.");
          return;
        }

        // Call backend to check registration/approval
        const response = await fetch(
          "http://localhost:5000/api/auth/login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              email: userEmail,
              userType: isStudent ? 'student' : 'instructor',
              captchaResponse: recaptchaValue,
              loginMethod: 'google'
            }),
          }
        );
        
        const data = await response.json();
        
        if (response.ok) {

          sessionStorage.setItem("authToken", credentialResponse.access_token);
          sessionStorage.setItem("userInfo", JSON.stringify(data.user));
          sessionStorage.setItem("accessToken", data.token); // Use accessToken for consistency
          sessionStorage.setItem("userType", isStudent ? 'student' : 'instructor');

          navigate(isStudent ? "/student" : "/instructor");
        } else {
          // Handle account locked (HTTP 423)
          if (response.status === 423) {
            showError(
              data.message || "Account is temporarily locked due to too many failed login attempts.",
              "Account Locked"
            );
            return;
          }
          
          if (data.message === "Student not registered" && isStudent) {
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
          if (data.message === "Instructor not registered" && isInstructor) {
            showError("Please wait for admin invitation to access the system.", "Access Denied");
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
      } catch {
        showError("An error occurred while logging in.", "Login Error");
      }
    },
    onError: () => {
      showError("Login failed. Please try again.", "Login Failed");
    },
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
            subtitle="Sign in using your institutional Google account"
          />

          {/* Google Login Button */}
          <GoogleLoginButton onClick={login} />

          {/* Divider */}
          {/* <Divider /> */}

          {/* Admin Login Button */}
          {/* <AdminLoginLink to="/adminLogin" /> */}

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
