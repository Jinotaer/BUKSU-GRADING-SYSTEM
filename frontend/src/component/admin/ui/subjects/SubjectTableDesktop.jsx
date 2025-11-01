import React from "react";
import { IconBook, IconEdit, IconArchive } from "@tabler/icons-react";

export function SubjectTableDesktop({
  subjects,
  isLocked,
  getLockedBy,
  onEdit,
  onArchive,
  getSemesterLabel,
}) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject Code
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Units
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              College
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Semester
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {subjects.map((subject) => (
            <tr key={subject._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <IconBook className="text-blue-600" size={16} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {subject.subjectCode}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 font-medium">
                  {subject.subjectName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {subject.units} units
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{subject.college}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{subject.department}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {getSemesterLabel(subject.semester)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(subject)}
                    disabled={isLocked(subject._id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isLocked(subject._id)
                        ? "text-gray-300 cursor-not-allowed bg-gray-50"
                        : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                    title={
                      isLocked(subject._id)
                        ? `Locked by ${getLockedBy(subject._id)}`
                        : "Edit Subject"
                    }
                  >
                    <IconEdit size={16} />
                  </button>
                  <button
                    onClick={() => onArchive(subject._id)}
                    disabled={isLocked(subject._id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isLocked(subject._id)
                        ? "text-gray-300 cursor-not-allowed bg-gray-50"
                        : "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                    }`}
                    title={
                      isLocked(subject._id)
                        ? `Locked by ${getLockedBy(subject._id)}`
                        : "Archive Subject"
                    }
                  >
                    <IconArchive size={16} />
                  </button>
                  {isLocked(subject._id) && (
                    <span
                      className="flex gap-1 text-xs font-regular text-red-500 px-2 py-2"
                      title={`Locked by ${getLockedBy(subject._id)}`}
                      aria-live="polite"
                    >
                      Locked
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
