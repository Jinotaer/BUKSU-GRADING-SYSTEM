import React from "react";
import { NavbarSimple } from "../../adminsidebar";

export function LoadingState() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <NavbarSimple />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 flex justify-center items-center ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    </div>
  );
}
