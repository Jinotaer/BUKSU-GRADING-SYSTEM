import React from "react";
import {
  IconEdit,
  IconArchive,
  IconBook,
  IconUser,
  IconUsers,
  IconSchool,
  IconEye,
} from "@tabler/icons-react";

export function SectionCard({
  section,
  isLocked,
  getLockedBy,
  onEdit,
  onArchive,
  onInviteStudents,
  onViewStudents,
  getSubjectName,
  getInstructorName,
}) {
  const sectionId = section._id || section.id;
  const locked = isLocked(sectionId);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <IconSchool className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">
              {section.sectionName}
            </h3>
            <p className="text-gray-600 text-sm">
              {section.schoolYear} - {section.term} Semester
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {locked && (
            <span
              className="flex items-center gap-1 text-xs font-regular text-red-500 px-2 py-1"
              title={`Locked by ${getLockedBy(sectionId)}`}
              aria-live="polite"
            >
              Locked
            </span>
          )}
          <button
            onClick={() => onEdit(section)}
            disabled={locked}
            className={`p-2 rounded-lg transition-colors ${
              locked
                ? "text-gray-300 cursor-not-allowed bg-gray-50"
                : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
            }`}
            title={locked ? `Locked by ${getLockedBy(sectionId)}` : "Edit Section"}
          >
            <IconEdit size={16} />
          </button>
          <button
            onClick={() => onArchive(sectionId)}
            disabled={locked}
            className={`p-2 rounded-lg transition-colors ${
              locked
                ? "text-gray-300 cursor-not-allowed bg-gray-50"
                : "text-gray-400 hover:text-red-600 hover:bg-red-50"
            }`}
            title={locked ? `Locked by ${getLockedBy(sectionId)}` : "Archive Section"}
          >
            <IconArchive size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <IconBook size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600">
            {getSubjectName(section.subject?._id || section.subject)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <IconUser size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600">
            Instructor:{" "}
            {getInstructorName(section.instructor?._id || section.instructor)}
          </span>
        </div>
        {section.students && (
          <div className="flex items-center gap-2">
            <IconUsers size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              {section.students.length} Students Enrolled
            </span>
          </div>
        )}

        {section.subject && (
          <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-800">Subject Details:</p>
            <p className="text-sm text-blue-600">
              Units: {section.subject.units || "N/A"} | College:{" "}
              {section.subject.college || "N/A"}
            </p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-blue-100">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onInviteStudents(section)}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <IconUsers size={16} />
              Invite Students
            </button>
            <button
              onClick={() => onViewStudents(section._id)}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <IconEye size={16} />
              View Students
            </button>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Created: {new Date(section.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
