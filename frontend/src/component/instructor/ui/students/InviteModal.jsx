import React from "react";
import { IconX, IconUsers } from "@tabler/icons-react";

export function InviteModal({
  isOpen,
  selectedSection,
  totalStudents,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  selectedStudents,
  onStudentSelection,
  onInvite,
  onClose,
  submitting,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-lg sm:rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
              Invite Students
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
              {selectedSection?.sectionName || selectedSection?.section_name} ·{" "}
              {selectedSection?.subject?.subjectName ||
                selectedSection?.subject?.subject_name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Current students: {totalStudents}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1"
          >
            <IconX className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Search by name, ID, or email
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Start typing…"
              className="w-full px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            />
          </div>

          <div className="max-h-40 sm:max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
            {searchQuery.trim() === "" ? (
              <div className="p-4 sm:p-6 text-center text-gray-500">
                <IconUsers className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-xs sm:text-sm">
                  Enter a query to find students
                </p>
              </div>
            ) : isSearching ? (
              <div className="p-4 text-center text-xs sm:text-sm text-gray-500">
                Searching…
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs sm:text-sm text-gray-500">
                No students found
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {searchResults.map((student) => (
                  <li
                    key={student._id}
                    className="p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student._id)}
                      onChange={() => onStudentSelection(student._id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {student.student_id} · {student.email}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedStudents.length > 0 && (
            <p className="text-xs sm:text-sm text-blue-600 font-medium">
              {selectedStudents.length} selected
            </p>
          )}

          <div className="bg-green-50 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm text-green-700">
            📧 Selected students will receive email invitations with section
            details and login instructions.
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 sm:pt-3 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs sm:text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onInvite}
              disabled={selectedStudents.length === 0 || submitting}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs sm:text-sm"
            >
              {submitting
                ? "Inviting…"
                : `Invite ${selectedStudents.length} student${
                    selectedStudents.length !== 1 ? "s" : ""
                  }`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
