import React from "react";
import { NavbarSimple } from "../../studentsidebar";

export function ErrorState({ error, onBack }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 ml-0 max-[880px]:ml-0 min-[881px]:ml-65 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Back to Subjects
          </button>
        </div>
      </div>
    </div>
  );
}
