import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import buksuLogo from "../assets/logo1.png";
import landingPageBg from "../assets/landingpage1.png";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationProvider } from "./common/NotificationModals";
import {
  BrandPanel,
  LoginFormContainer,
  ErrorMessage,
} from "./ui/login";

export default function PasswordReset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const notifications = useNotifications();
  const { showSuccess, showError } = notifications;

  const [step, setStep] = useState("request"); // 'request' or 'reset'
  const [userType, setUserType] = useState(location.state?.userType || "student");
  const [email, setEmail] = useState(location.state?.email || "");
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // If token is provided in URL, verify it and go to reset step
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        "http://localhost:5000/api/auth/verify-reset-token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, userType }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setEmail(data.email);
        setStep("reset");
      } else {
        setError(data.message || "Invalid reset token");
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (error) {
      setError("Failed to verify reset token");
      setTimeout(() => navigate("/login"), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/request-password-reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, userType }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        showSuccess(
          "Password reset instructions have been sent to your email.",
          "Reset Email Sent"
        );
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.message || "Failed to send reset email");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            newPassword,
            userType,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        showSuccess(
          "Password has been reset successfully. Redirecting to login...",
          "Password Reset Complete"
        );
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
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

        {/* Right Panel - Reset Form */}
        <LoginFormContainer>
          <div className="mb-6">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-500 text-sm flex items-center mb-4"
            >
              ← Back to Login
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {step === "request" ? "Reset Password" : "Set New Password"}
            </h2>
            <p className="text-gray-600 mt-2">
              {step === "request"
                ? "Enter your email address and we'll send you instructions to reset your password."
                : "Enter your new password below."}
            </p>
          </div>

          {step === "request" ? (
            <form onSubmit={handleRequestReset} className="space-y-4">
              {/* User Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Account Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["student", "instructor", "admin"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUserType(type)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        userType === type
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Enter your ${userType} email address`}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label
                  htmlFor="email-display"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email-display"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password (minimum 8 characters)"
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your new password"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {/* Error message */}
          <ErrorMessage message={error} />
        </LoginFormContainer>
      </div>
    </NotificationProvider>
  );
}