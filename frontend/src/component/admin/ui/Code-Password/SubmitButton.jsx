import React from "react";

export function SubmitButton({ loading, loadingText, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full px-4 py-3 bg-blue-900 text-white font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 ${
        loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-800"
      }`}
      style={{ backgroundColor: "#091057" }}
    >
      {loading ? loadingText : children}
    </button>
  );
}
