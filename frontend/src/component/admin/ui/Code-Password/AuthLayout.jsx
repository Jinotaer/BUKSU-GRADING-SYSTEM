import React from "react";
import buksuLogo from "../../../../assets/logo1.png";
import landingPageBg from "../../../../assets/landingpage1.png";

export function AuthLayout({ children, onBack }) {
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

      {/* Right Panel - Content */}
      <div className="w-full lg:w-[500px] xl:w-[480px] flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-12 lg:px-16 lg:py-12 bg-gray-50 relative">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
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
        )}

        <div className="max-w-md mx-auto mt-8">
          {children}
        </div>
      </div>
    </div>
  );
}
