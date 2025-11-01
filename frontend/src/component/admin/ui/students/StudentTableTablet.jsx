import React from "react";
import { IconArchive } from "@tabler/icons-react";

export function StudentTableTablet({ students, onArchive }) {
  return (
    <div className="hidden md:block xl:hidden overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Info</th>
            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {students.map((student) => (
            <tr key={student._id} className="hover:bg-gray-50">
              <td className="px-2 py-3">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{student.fullName}</div>
                  <div className="text-xs text-gray-500">{student.studid}</div>
                  <div className="text-xs text-blue-600 break-all">{student.email}</div>
                </div>
              </td>
              <td className="px-2 py-3">
                <div className="text-xs text-gray-600">
                  <div><span className="font-medium">{student.college}</span></div>
                  <div>{student.course}</div>
                  <div>Year {student.yearLevel}</div>
                </div>
              </td>
              <td className="px-2 py-3">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {student.status}
                </span>
              </td>
              <td className="px-2 py-3">
                <div className="flex gap-1">
                  <button
                    onClick={() => onArchive(student._id)}
                    className="inline-flex items-center px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
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
