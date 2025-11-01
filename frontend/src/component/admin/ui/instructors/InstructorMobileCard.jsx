import React from "react";
import { IconArchive } from "@tabler/icons-react";

export function InstructorMobileCard({ instructors, onArchive }) {
  return (
    <div className="md:hidden space-y-4">
      {instructors.map((inst, i) => (
        <div
          key={`${inst.instructorid || inst._id || inst.id}-${i}`}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
        >
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 text-sm">
              {inst.fullName || inst.name || "N/A"}
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                <span className="font-medium">ID:</span>{" "}
                {inst.instructorid || inst._id || inst.id || "N/A"}
              </div>
              <div>
                <span className="font-medium">Email:</span>{" "}
                <span className="text-blue-600">{inst.email || "N/A"}</span>
              </div>
              <div>
                <span className="font-medium">College:</span>{" "}
                {inst.college || "N/A"}
              </div>
              <div>
                <span className="font-medium">Department:</span>{" "}
                {inst.department || "N/A"}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onArchive(inst._id || inst.id)}
                className="inline-flex items-center px-3 py-2 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
              >
                <IconArchive className="w-3 h-3 mr-1" />
                Archive
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
