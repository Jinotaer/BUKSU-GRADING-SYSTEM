import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import buksuLogo from "../../assets/logo1.png";
import landingPageBg from "../../assets/landingpage1.png";
import adminAuth from "../../utils/adminAuth";

export default function AdminRequestCode() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

 

    const email = e.target.adminEmail.value;

    try {
      setLoading(true);
      const data = await adminAuth.requestResetCode(email);
      if (data.ok) {
        setSuccess("A reset code has been sent to your email.");
        e.target.reset();
        navigate("/admin/adminVerifyCode");
      } else {
        setError(data.message || "Failed to send reset code.");
      }
    } catch (error) {
      console.error("Request code error:", error);
      setError(error.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen max-md:flex-col">
      {/* Left Panel - Background Image */}
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

      {/* Right Panel - Request Code Form */}
      <div className="w-full lg:w-[500px] xl:w-[480px] flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-12 lg:px-16 lg:py-12 bg-gray-50 relative">
        {/* Back Button */}
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
            Request Reset Code
          </h2>
          <p className="text-center text-gray-600 text-sm mb-8">
            Enter your admin email to receive a reset code
          </p>

          <form onSubmit={handleRequestCode} className="space-y-5">
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

            <button
              type="submit"
              disabled={loading}
              className={`w-full px-4 py-3 bg-blue-900 text-white font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-800"
              }`}
              style={{ backgroundColor: "#091057" }}
            >
              {loading ? "Sending..." : "Request Code"}
            </button>

          </form>

          {/* Feedback messages */}
          {success && (
            <p className="text-green-600 text-sm text-center mt-4">{success}</p>
          )}
          {error && (
            <p className="text-red-600 text-sm text-center mt-4">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
