import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { FcGoogle } from "react-icons/fc"; // Google logo icon
import buksuLogo from "../assets/logo1.png";
import landingPageBg from "../assets/landingpage1.png"; 
import { useNotifications } from "../hooks/useNotifications"; 
import { NotificationProvider } from "./common/NotificationModals";

const recaptchaKey = "6Lfty3MqAAAAACp-CJm8DFxDW1GfjdR1aXqHbqpg";

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
              userType: isStudent ? 'student' : 'instructor'
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
        <div 
          className="flex-1 relative flex flex-col p-6 sm:p-8 lg:p-12 bg-cover bg-right bg-no-repeat overflow-hidden min-h-[40vh] lg:min-h-screen "
          style={{ backgroundImage: `url(${landingPageBg})` }}
        >
          
          {/* Logo and Title at the top */}
          <div className="relative z-10 flex flex-col items-center text-center pt-4 sm:pt-6 lg:pt-8">
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <img
                src={buksuLogo}
                alt="BUKSU Logo"
                className="h-16 w-16 sm:h-20 sm:w-20 lg:h-28 lg:w-28 rounded object-cover mx-auto"
              />
            </div>
            <h1 className="text-white font-extrabold leading-tight text-2xl sm:text-3xl lg:text-5xl tracking-wider uppercase text-shadow-lg font-sans">
              BUKSU GRADING SYSTEM
            </h1>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-[500px] xl:w-[480px] flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-12 lg:px-16 lg:py-12 bg-gray-50">
          <div className="w-full max-w-sm mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
              Sign in using your institutional Google account
            </p>

            {/* Google Login Button */}
            <button
              className="w-full flex items-center justify-center gap-3 px-4 sm:px-6 py-3 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg text-sm sm:text-base hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-4 sm:mb-6"
              onClick={login}
            >
              <FcGoogle size={20} className="sm:w-6 sm:h-6" />
              <span className="text-sm sm:text-base">Sign in with Google</span>
            </button>
              {/* Divider */}
          <div
            style={{ display: "flex", alignItems: "center", margin: "24px 0" }}
          >
            <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
            <span style={{ margin: "0 12px", color: "#888", fontSize: 14 }}>
              or
            </span>
            <div style={{ flex: 1, height: 1, background: "#e0e0e0" }} />
          </div>
            {/* Admin Login Button */}
            <Link
              to="/adminLogin"
              className="w-full block text-center px-4 sm:px-6 py-3 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 no-underline text-sm sm:text-base" style={{ backgroundColor: '#091057' }}
            >
              Login as Admin
            </Link>

            {/* reCAPTCHA */}
            <div className="flex justify-center mt-4 sm:mt-6 mb-4 sm:mb-6">
              <div className="w-full max-w-xs flex justify-center">
                <ReCAPTCHA 
                  sitekey={recaptchaKey} 
                  onChange={onRecaptchaChange}
                  size="normal"
                  theme="light"
                />
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div>
                <p className="text-red-600 text-xs sm:text-sm text-center">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}
