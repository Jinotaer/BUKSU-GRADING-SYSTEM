import React from "react";
import { NavbarSimple } from "../../studentsidebar";

export function LoadingState() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center items-center ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading profile...</span>
        </div>
      </div>
    </div>
  );
}
