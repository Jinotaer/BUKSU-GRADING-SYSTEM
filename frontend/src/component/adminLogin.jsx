import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import buksuLogo from "../assets/logo1.png";
import landingPageBg from "../assets/landingpage1.png";
import adminAuth from "../utils/adminAuth";


const recaptchaKey = "6Lfty3MqAAAAACp-CJm8DFxDW1GfjdR1aXqHbqpg";

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
      const data = await adminAuth.login(email, password);
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
      {/* Right Panel - Form */}
      <div className="w-full lg:w-[500px] xl:w-[480px] flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-12 lg:px-16 lg:py-12 bg-gray-50 relative">
        {/* Back Arrow */}
        <button
          onClick={() => navigate("/login")}
          className="absolute top-8 left-8 text-gray-600 hover:text-gray-800 transition-colors"
          aria-label="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="max-w-md mx-auto mt-8">
          <h2 className="font-bold text-center mb-2 text-gray-900 text-3xl">
            Admin Login
          </h2>
          <p className="text-center text-gray-600 text-sm mb-8">
            Enter Credentials to Manage System
          </p>

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label
                htmlFor="adminEmail"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email:
              </label>
              <input
                type="email"
                name="adminEmail"
                id="adminEmail"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="adminPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password:
              </label>
              <input
                type="password"
                name="adminPassword"
                id="adminPassword"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-blue-900 text-white font-semibold rounded-md hover:bg-blue-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2"
              style={{ backgroundColor: "#091057" }}
            >
              Login
            </button>
            <div className="flex justify-end">
              <a
                href="#"
                onClick={e => { e.preventDefault(); navigate("/admin/adminRequestCode"); }}
                className="text-sm text-blue-600 hover:underline cursor-pointer"
              >
                Forgot password?
              </a>
            </div>
          </form>

          {/* reCAPTCHA */}
          <div className="flex justify-center mt-4 sm:mt-6 mb-4 sm:mb-6">
            <div className="w-full max-w-xs flex justify-center">
              <ReCAPTCHA
                sitekey={recaptchaKey}
                onChange={handleCaptchaChange}
                onExpired={handleCaptchaExpired}
                onErrored={handleCaptchaError}
                size="normal"
                theme="light"
              />
            </div>
          </div>
          {error && (
            <div>
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
