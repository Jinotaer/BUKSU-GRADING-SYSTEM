import React from "react";
import { IconEdit } from "@tabler/icons-react";

export function PageHeader({ onEditClick }) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold font-outfit text-gray-800">
          Admin Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal information and account settings.
        </p>
      </div>
      <button
        type="button"
        onClick={onEditClick}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors cursor-pointer"
      >
        <IconEdit size={16} />
        Edit Profile
      </button>
    </div>
  );
}
