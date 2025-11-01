import React from "react";

export const GradesTable = ({ displayGrades, semesters, selectedSemester, selectedYear }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border-2 border-gray-200">
      {/* Semester Info */}
      <div className="px-4 sm:px-6 py-3 border-gray-200">
        <h2 className="text-base sm:text-lg font-medium text-gray-700">
          {semesters.find((s) => s.value === selectedSemester)?.label}, S.Y.{" "}
          {selectedYear}
        </h2>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="overflow-x-auto">
        {displayGrades.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course Code
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Final Grade
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {displayGrades.map((grade, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {grade.courseCode}
                  </td>
                  <td className="px-4 py-2 text-sm whitespace-nowrap">
                    {grade.subjectName}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {grade.instructor}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {grade.units > 0 ? grade.units.toFixed(1) : "N/A"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {grade.finalGrade > 0
                      ? grade.finalGrade.toFixed(2)
                      : "N/A"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        grade.remarks === "Passed"
                          ? "bg-green-100 text-green-800"
                          : grade.remarks === "Failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {grade.remarks}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <p className="text-gray-500 text-lg mb-2">No Grades Available</p>
            <p className="text-gray-400 text-sm">
              No grades found for{" "}
              {semesters.find((s) => s.value === selectedSemester)?.label},
              S.Y. {selectedYear}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
