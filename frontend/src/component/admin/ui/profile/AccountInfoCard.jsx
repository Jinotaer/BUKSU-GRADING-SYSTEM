import React from "react";
import { IconCalendar, IconEye } from "@tabler/icons-react";

export function AccountInfoCard({ profile, formatDate }) {
  return (
    <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4 font-outfit text-gray-700">
        Account Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-start gap-3">
          <IconCalendar size={20} className="text-gray-500 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Account Created</p>
            <p className="font-medium text-gray-800">
              {formatDate(profile?.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <IconEye size={20} className="text-gray-500 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Last Login</p>
            <p className="font-medium text-gray-800">
              {formatDate(profile?.lastLogin)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
