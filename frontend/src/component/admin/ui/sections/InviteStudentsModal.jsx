import React from "react";
import { IconUsers, IconAlertCircle } from "@tabler/icons-react";

export function InviteStudentsModal({
  selectedSection,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
  selectedStudents,
  onStudentSelection,
  onInvite,
  onCancel,
  getSubjectName,
  getInstructorName,
}) {
  return (
    <div className="space-y-4">
      {selectedSection && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">
            Section Information:
          </h4>
          <p className="text-sm text-blue-600">
            <strong>Subject:</strong>{" "}
            {getSubjectName(
              selectedSection.subject?._id || selectedSection.subject
            )}
          </p>
          <p className="text-sm text-blue-600">
            <strong>Section:</strong> {selectedSection.sectionName}
          </p>
          <p className="text-sm text-blue-600">
            <strong>Instructor:</strong>{" "}
            {getInstructorName(
              selectedSection.instructor?._id || selectedSection.instructor
            )}
          </p>
          <p className="text-sm text-blue-600">
            <strong>Current Students:</strong>{" "}
            {selectedSection.students?.length || 0}
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Students by Student ID or Email:
        </label>
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Enter student ID or email (e.g., 2021-001234 or 2301106754@student.buksu.edu.ph)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none pr-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Type the student's ID number or institutional email address to search
          </p>
        </div>

        <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
          {searchQuery.trim() === "" ? (
            <div className="p-4 text-center text-gray-500">
              <IconUsers className="mx-auto mb-2 text-gray-300" size={24} />
              <p>Enter a student ID or email to search for students</p>
              <p className="text-xs mt-1">
                Examples: 2021-001234 or 2301106754@student.buksu.edu.ph
              </p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-2 space-y-2">
              {searchResults.map((student) => (
                <label
                  key={student._id}
                  className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student._id)}
                    onChange={() => onStudentSelection(student._id)}
                    className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {student.fullName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {student.studid} • {student.yearLevel} • {student.course}
                    </div>
                    <div className="text-xs text-blue-600">
                      Email: {student.email}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          ) : !isSearching && searchQuery.trim() !== "" ? (
            <div className="p-4 text-center text-gray-500">
              <IconAlertCircle
                className="mx-auto mb-2 text-orange-400"
                size={24}
              />
              <p>No students found for: "{searchQuery}"</p>
              <p className="text-xs mt-1">
                Please check the student ID or email and try again
              </p>
            </div>
          ) : null}
        </div>

        {selectedStudents.length > 0 && (
          <p className="text-sm text-blue-600 mt-2">
            {selectedStudents.length} student
            {selectedStudents.length !== 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-700">
          📧 Selected students will receive email invitations with section
          details and login instructions.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={isSearching}
        >
          Cancel
        </button>
        <button
          onClick={onInvite}
          disabled={isSearching || selectedStudents.length === 0}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <IconUsers size={16} />
          Invite {selectedStudents.length} Student
          {selectedStudents.length !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}
