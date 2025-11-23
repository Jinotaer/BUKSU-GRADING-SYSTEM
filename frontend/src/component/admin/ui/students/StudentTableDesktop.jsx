import React from "react";
import { IconArchive } from "@tabler/icons-react";

export function StudentTableDesktop({ students, onArchive }) {
  return (
    <div className="hidden xl:block overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">College</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year Level</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {students.map((student) => (
            <tr key={student._id} className="hover:bg-gray-50">
              <td className="px-3 py-3 text-sm">{student.studid}</td>
              <td className="px-3 py-3 text-sm font-sm">{student.fullName}</td>
              <td className="px-3 py-3 text-sm text-blue-600 break-all">{student.email}</td>
              <td className="px-3 py-3 text-sm">{student.college}</td>
              <td className="px-3 py-3 text-sm">{student.course}</td>
              <td className="px-3 py-3 text-sm">{student.yearLevel}</td>
              <td className="px-3 py-3 text-sm">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {student.status}
                </span>
              </td>
              <td className="px-3 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onArchive(student._id)}
                    className="inline-flex items-center px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                  >
                    <IconArchive className="w-3 h-3 mr-1" />
                    Archive
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
