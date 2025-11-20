import React from "react";
import { IconEdit } from "@tabler/icons-react";

export function ProfileHeader({ onEditClick }) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-2xl sm:text-3xl lg:text-3xl font-bold">
          Student Profile
        </h1>
        <p className="text-gray-600 mt-1 text-xs sm:text-sm md:text-base">
          Manage your personal information and account settings.
        </p>
      </div>
      <button
        onClick={onEditClick}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
      >
        <IconEdit size={16} />
        Edit Profile
      </button>
    </div>
    
  );
}
