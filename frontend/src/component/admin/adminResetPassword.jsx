import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import buksuLogo from "../../assets/logo1.png";
import landingPageBg from "../../assets/landingpage1.png";
import adminAuth from "../../utils/adminAuth";

export default function AdminResetPassword() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [passcode, setPasscode] = useState(() =>
    sessionStorage.getItem("admin_reset_passcode") || ""
  );

  useEffect(() => {
    if (!passcode) {
      setError("Reset code expired. Please request a new one.");
      const redirect = setTimeout(() => navigate("/admin/adminRequestCode"), 3000);
      return () => clearTimeout(redirect);
    }
    return undefined;
  }, [passcode, navigate]);

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const newPassword = event.target.newPassword.value;
    const confirmPassword = event.target.confirmPassword.value;
    const storedPasscode = sessionStorage.getItem("admin_reset_passcode");

    if (!storedPasscode) {
      setError("Reset code not found. Please request a new one.");
      setPasscode("");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await adminAuth.resetPassword(storedPasscode, newPassword);

      if (response.success || response.ok) {
        setSuccess("Password successfully updated!");
        sessionStorage.removeItem("admin_reset_passcode");
        event.target.reset();
        navigate("/admin/adminLogin");
      } else {
        setError(response.message || "Failed to reset password.");
      }
    } catch (resetError) {
      console.error("Reset password error:", resetError);
      setError(resetError.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen max-md:flex-col">
      <div
        className="flex-1 relative flex flex-col p-6 sm:p-8 lg:p-12 bg-cover bg-right bg-no-repeat overflow-hidden min-h-[40vh] lg:min-h-screen"
        style={{ backgroundImage: `url(${landingPageBg})` }}
      >
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

      <div className="w-full lg:w-[500px] xl:w-[480px] flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-12 lg:px-16 lg:py-12 bg-gray-50 relative">
        <button
          onClick={() => navigate("/admin/adminLogin")}
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="max-w-md mx-auto mt-8">
          <h2 className="font-bold text-center mb-2 text-gray-900 text-3xl">
            Reset Password
          </h2>
          <p className="text-center text-gray-600 text-sm mb-8">
            Set a new password for your administrator account
          </p>

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                New Password:
              </label>
              <input
                type="password"
                name="newPassword"
                id="newPassword"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm New Password:
              </label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-3 bg-blue-900 text-white font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-800"
              }`}
              style={{ backgroundColor: "#091057" }}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>

          {success && <p className="text-green-600 text-sm text-center mt-4">{success}</p>}
          {error && <p className="text-red-600 text-sm text-center mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
}
