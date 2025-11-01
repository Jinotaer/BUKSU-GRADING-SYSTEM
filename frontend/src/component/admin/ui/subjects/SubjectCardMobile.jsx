import React from "react";
import { IconBook, IconEdit, IconArchive } from "@tabler/icons-react";

export function SubjectCardMobile({
  subjects,
  isLocked,
  getLockedBy,
  onEdit,
  onArchive,
  getSemesterLabel,
}) {
  return (
    <div className="lg:hidden divide-y divide-gray-200">
      {subjects.map((subject) => (
        <div
          key={subject._id}
          className="p-4 sm:p-5 md:p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex flex-col space-y-3 sm:space-y-4">
            {/* Header with Subject Code and Actions */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center min-w-0 flex-1">
                <div className="p-2 bg-blue-100 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                  <IconBook className="text-blue-600" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {subject.subjectCode}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                    {subject.subjectName}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 sm:gap-2 flex-shrink-0 items-start">
                {isLocked(subject._id) && (
                  <span
                    className="flex gap-1 text-[10px] sm:text-xs font-medium text-red-500 px-2 py-1.5 sm:py-2 whitespace-nowrap"
                    title={`Locked by ${getLockedBy(subject._id)}`}
                    aria-live="polite"
                  >
                    Locked
                  </span>
                )}
                <button
                  onClick={() => onEdit(subject)}
                  disabled={isLocked(subject._id)}
                  className={`p-2 rounded-lg transition-colors touch-manipulation ${
                    isLocked(subject._id)
                      ? "text-gray-300 cursor-not-allowed bg-gray-50"
                      : "text-gray-400 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100"
                  }`}
                  title={
                    isLocked(subject._id)
                      ? `Locked by ${getLockedBy(subject._id)}`
                      : "Edit Subject"
                  }
                >
                  <IconEdit size={18} className="sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => onArchive(subject._id)}
                  disabled={isLocked(subject._id)}
                  className={`p-2 rounded-lg transition-colors touch-manipulation ${
                    isLocked(subject._id)
                      ? "text-gray-300 cursor-not-allowed bg-gray-50"
                      : "text-gray-400 hover:text-orange-600 hover:bg-orange-50 active:bg-orange-100"
                  }`}
                  title={
                    isLocked(subject._id)
                      ? `Locked by ${getLockedBy(subject._id)}`
                      : "Archive Subject"
                  }
                >
                  <IconArchive size={18} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Subject Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
              <div>
                <span className="text-gray-500 font-medium text-xs sm:text-sm block">
                  Units:
                </span>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {subject.units} units
                  </span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500 font-medium text-xs sm:text-sm block">
                  College:
                </span>
                <div className="mt-1 text-gray-900 text-xs sm:text-sm break-words">
                  {subject.college}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-gray-500 font-medium text-xs sm:text-sm block">
                  Department:
                </span>
                <div className="mt-1 text-gray-900 text-xs sm:text-sm break-words">
                  {subject.department}
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 font-medium text-xs sm:text-sm block">
                  Semester:
                </span>
                <div className="mt-1 text-gray-900 text-xs sm:text-sm break-words">
                  {getSemesterLabel(subject.semester)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
