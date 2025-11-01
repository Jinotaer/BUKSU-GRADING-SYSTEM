import React from "react";
import { IconSchool, IconBuilding, IconBookmark, IconCalendar } from "@tabler/icons-react";

export function InstitutionInfoCard({ profile }) {
  return (
    <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4 font-outfit text-gray-700">
        Institution Information
      </h3>
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <IconSchool className="text-blue-600" size={20} />
            <span className="font-medium text-blue-800">Institution</span>
          </div>
          <p className="text-sm text-blue-700">
            Bukidnon State University
          </p>
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
        {profile?.course && (
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <IconBookmark className="text-purple-600" size={20} />
              <span className="font-medium text-purple-800">Course</span>
            </div>
            <p className="text-sm text-purple-700">{profile.course}</p>
          </div>
        )}
        {profile?.yearLevel && (
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <IconCalendar className="text-orange-600" size={20} />
              <span className="font-medium text-orange-800">Year Level</span>
            </div>
            <p className="text-sm text-orange-700">{profile.yearLevel}</p>
          </div>
        )}
      </div>
    </div>
  );
}
