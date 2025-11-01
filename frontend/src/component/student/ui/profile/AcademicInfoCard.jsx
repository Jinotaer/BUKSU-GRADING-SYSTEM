import React from "react";
import { IconSchool, IconBuilding, IconCalendar } from "@tabler/icons-react";

export function AcademicInfoCard({ profile }) {
  return (
    <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4 font-outfit text-gray-700">
        Academic Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-start gap-3">
          <IconSchool size={20} className="text-gray-500 mt-1" />
          <div>
            <p className="text-sm text-gray-500">College</p>
            <p className="font-medium text-gray-800">
              {profile?.college || "Not specified"}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <IconBuilding size={20} className="text-gray-500 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Course</p>
            <p className="font-medium text-gray-800">
              {profile?.course || "Not specified"}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <IconCalendar size={20} className="text-gray-500 mt-1" />
          <div>
            <p className="text-sm text-gray-500">Year Level</p>
            <p className="font-medium text-gray-800">
              {profile?.yearLevel || "Not specified"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
