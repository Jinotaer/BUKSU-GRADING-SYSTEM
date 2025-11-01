import React from "react";
import { NavbarSimple } from "../../studentsidebar";

export function LoadingState() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 ml-0 max-[880px]:ml-0 min-[881px]:ml-65 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your scores...</p>
        </div>
      </div>
    </div>
  );
}
