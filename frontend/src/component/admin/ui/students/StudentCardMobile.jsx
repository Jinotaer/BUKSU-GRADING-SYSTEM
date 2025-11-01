import React from "react";
import { IconArchive } from "@tabler/icons-react";

export function StudentCardMobile({ students, onArchive }) {
  return (
    <div className="md:hidden space-y-3">
      {students.map((student) => (
        <div key={student._id} className="bg-gray-50 rounded-lg p-3 xs:p-4 border border-gray-200">
          <div className="flex flex-col gap-3">
            {/* Header with name and status */}
            <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm xs:text-base">{student.fullName}</h3>
                <p className="text-xs text-gray-500">ID: {student.studid}</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs w-fit">
                {student.status}
              </span>
            </div>
            
            {/* Student details */}
            <div className="text-xs text-gray-600 space-y-1">
              <div className="break-all">
                <span className="font-medium">Email:</span> 
                <span className="text-blue-600 ml-1">{student.email}</span>
              </div>
              <div>
                <span className="font-medium">College:</span> {student.college}
              </div>
              <div className="flex flex-col xs:flex-row xs:gap-4">
                <div>
                  <span className="font-medium">Course:</span> {student.course}
                </div>
                <div>
                  <span className="font-medium">Year:</span> {student.yearLevel}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => onArchive(student._id)}
                className="inline-flex items-center px-3 py-2 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition-colors"
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
