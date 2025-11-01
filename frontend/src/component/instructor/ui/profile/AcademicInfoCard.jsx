import React from "react";
import { IconSchool, IconBuilding } from "@tabler/icons-react";

export function AcademicInfoCard({ profile }) {
  if (!profile?.college && !profile?.department) return null;

  return (
    <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4 font-outfit text-gray-700">
        Academic Information
      </h3>
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <IconSchool className="text-blue-600" size={20} />
            <span className="font-medium text-blue-800">Institution</span>
          </div>
          <p className="text-sm text-blue-700">Bukidnon State University</p>
        </div>
        {profile?.college && (
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <IconBuilding className="text-green-600" size={20} />
              <span className="font-medium text-green-800">College</span>
            </div>
            <p className="text-sm text-green-700">{profile.college}</p>
          </div>
        )}
        {profile?.department && (
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <IconBuilding className="text-purple-600" size={20} />
              <span className="font-medium text-purple-800">Department</span>
            </div>
            <p className="text-sm text-purple-700">{profile.department}</p>
          </div>
        )}
      </div>
    </div>
  );
}
