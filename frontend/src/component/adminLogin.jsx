import { useNavigate } from "react-router-dom";
import { useState } from "react";
import buksuLogo from "../assets/logo1.png";
import landingPageBg from "../assets/landingpage1.png";
import adminAuth from "../utils/adminAuth";
import {
  AdminLoginForm,
  BackButton,
  BrandPanel,
  CaptchaSection,
  ErrorMessage,
  ForgotPasswordLink,
  LoginHeader,
} from "./ui/adminLogin";

const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6Ld3NiEsAAAAAICG9oNYX77QFtEQhtqODzPIONoB";

if (!recaptchaKey) {
  console.error('VITE_RECAPTCHA_SITE_KEY environment variable is not set');
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [captchaValue, setCaptchaValue] = useState(null);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!captchaValue) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }

    const email = e.target.adminEmail.value;
    const password = e.target.adminPassword.value;

    try {
      const data = await adminAuth.login(email, password, captchaValue);
      if (data.success) {
        // Store the access token in sessionStorage for ProtectedRoute compatibility
        sessionStorage.setItem("accessToken", data.tokens.accessToken);
        sessionStorage.setItem("userType", "Admin");
        sessionStorage.setItem("adminInfo", JSON.stringify(data.admin));

        navigate("/admin");
      } else {
        setError(data.message || "Admin login failed.");
      }
    } catch (error) {
      console.error("Login error:", error);

      // Check if it's an admin auth error with response data
      if (error.response) {
        const errorData = error.response;

        // Handle account locked (HTTP 423)
        if (error.response.status === 423) {
          setError(
            errorData.message ||
              "Account is temporarily locked due to too many failed login attempts."
          );
        } else {
          // Handle other login failures with remaining attempts info
          let errorMessage = errorData.message || "Login failed.";
          if (
            errorData.remainingAttempts !== undefined &&
            errorData.remainingAttempts > 0
          ) {
            errorMessage += ` ${errorData.remainingAttempts} attempt${
              errorData.remainingAttempts > 1 ? "s" : ""
            } remaining.`;
          }
          setError(errorMessage);
        }
      } else {
        setError(error.message || "Network error. Please try again.");
      }
    }
  };

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
    if (value) {
      setError(""); // Clear error when captcha is completed
    }
  };

  const handleCaptchaExpired = () => {
    setCaptchaValue(null);
    setError("reCAPTCHA expired. Please verify again.");
  };

  const handleCaptchaError = () => {
    setCaptchaValue(null);
    setError("reCAPTCHA error. Please try again.");
  };

  return (
    <div className="flex min-h-screen max-md:flex-col">
      {/* Left Panel - Background Image */}
      <BrandPanel
        logoSrc={buksuLogo}
        backgroundSrc={landingPageBg}
        title="BUKSU GRADING SYSTEM"
      />

      {/* Right Panel - Form */}
      <div className="w-full lg:w-[500px] xl:w-[480px] flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-12 lg:px-16 lg:py-12 bg-gray-50 relative">
        {/* Back Arrow */}
        <BackButton onClick={() => navigate("/login")} />

        <div className="max-w-md mx-auto mt-8">
          <LoginHeader
            title="Admin Login"
            subtitle="Enter Credentials to Manage System"
          />

          <AdminLoginForm onSubmit={handleAdminLogin} />

          <ForgotPasswordLink
            onClick={() => navigate("/admin/adminRequestCode")}
          />

          {/* reCAPTCHA */}
          <CaptchaSection
            sitekey={recaptchaKey}
            onChange={handleCaptchaChange}
            onExpired={handleCaptchaExpired}
            onErrored={handleCaptchaError}
          />

          <ErrorMessage message={error} />
        </div>
      </div>
    </div>
  );
}
