import React from "react";

export function StudentsTable({
  students,
  filteredStudents,
  onRemoveStudent,
  onClearSearch,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Student ID
            </th>
            <th
              scope="col"
              className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Name
            </th>
            <th
              scope="col"
              className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Email
            </th>
            <th
              scope="col"
              className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-3 sm:px-4 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500"
              >
                No students yet. Click{" "}
                <span className="font-medium">Add Students</span> to invite.
              </td>
            </tr>
          ) : filteredStudents.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-3 sm:px-4 py-6 sm:py-8 text-center text-xs sm:text-sm text-gray-500"
              >
                No students match your search criteria.{" "}
                <button
                  onClick={onClearSearch}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Clear search
                </button>
              </td>
            </tr>
          ) : (
            filteredStudents.map((s) => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                  {s.student_id || "—"}
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 font-medium">
                  <div className="max-w-[150px] sm:max-w-none">
                    <div className="truncate">
                      {`${s.first_name} ${s.last_name}`.trim() || "—"}
                    </div>
                    {/* Show email on mobile under name */}
                    {s.email && (
                      <a
                        href={`mailto:${s.email}`}
                        className="md:hidden text-xs text-blue-600 hover:underline truncate block mt-0.5"
                      >
                        {s.email}
                      </a>
                    )}
                  </div>
                </td>
                <td className="hidden md:table-cell px-4 py-3 text-sm">
                  {s.email ? (
                    <a
                      href={`mailto:${s.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {s.email}
                    </a>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                  <button
                    onClick={() => onRemoveStudent(s._id)}
                    className="inline-flex items-center px-2 sm:px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 whitespace-nowrap"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
