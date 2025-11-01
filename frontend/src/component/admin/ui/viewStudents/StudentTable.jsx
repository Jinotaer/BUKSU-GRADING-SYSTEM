import React from "react";

export function StudentTable({ students, submitting, onRemoveStudent }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm sm:text-base border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              COURSE
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              YEAR LEVEL
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student._id} className="hover:bg-blue-50 transition">
              <td className="px-4 py-3 text-xs md:text-sm max-w-[80px]">
                {student.studid}
              </td>
              <td className="px-4 py-3 text-xs md:text-sm truncate max-w-[120px] whitespace-nowrap">
                {student.fullName || "Unknown Student"}
              </td>
              <td className="px-4 py-3 text-xs md:text-sm text-blue-600 truncate">
                {student.email}
              </td>
              <td className="px-4 py-3 text-xs md:text-sm truncate max-w-[120px]">
                {student.course}
              </td>
              <td className="px-4 py-3 text-xs md:text-sm">
                {student.yearLevel}
              </td>
              <td className="px-3 sm:px-5 py-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold shadow-sm">
                  Invited
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() =>
                    onRemoveStudent(
                      student._id,
                      student.fullName || "Student"
                    )
                  }
                  disabled={submitting}
                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
