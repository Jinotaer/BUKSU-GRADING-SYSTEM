import React from "react";
import { IconUser, IconMail, IconBookmark, IconShield } from "@tabler/icons-react";

export function PersonalInfoCard({ profile }) {
  return (
    <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4 font-outfit text-gray-700">
        Personal Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-start gap-3">
          <IconUser size={20} className="text-gray-500 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Full Name</p>
            <p className="font-medium text-gray-800">
              {profile?.fullName || "Not specified"}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <IconMail size={20} className="text-gray-500 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Email Address</p>
            <p className="font-medium text-gray-800">{profile?.email}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <IconBookmark size={20} className="text-gray-500 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Student ID</p>
            <p className="font-medium text-gray-800">
              {profile?.studid || "Not specified"}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <IconShield size={20} className="text-gray-500 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-medium text-gray-800">{profile?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
