import React, { useState, useEffect } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { NavbarSimple } from "./studentsidebar";

const sampleGrades = [
  { courseCode: "GE 102", subjectName: "Ethics", instructor: "J. Manlutang", units: 3.0, finalGrade: 1.0, remarks: "Passed" },
  { courseCode: "IT 131", subjectName: "Entrepreneurship", instructor: "J. L. Dela Cruz", units: 3.0, finalGrade: 1.0, remarks: "Passed" },
  { courseCode: "IT 132", subjectName: "Advanced Database Systems", instructor: "J. Manlutang", units: 3.0, finalGrade: 1.0, remarks: "Passed" },
  { courseCode: "IT 133", subjectName: "Systems Integration and Architecture 1", instructor: "J. Manlutang", units: 3.0, finalGrade: 1.0, remarks: "Passed" },
  { courseCode: "IT 134", subjectName: "Networking 2", instructor: "J. Manlutang", units: 3.0, finalGrade: 1.0, remarks: "Passed" },
  { courseCode: "IT 135", subjectName: "Information Assurance and Security 1", instructor: "J. Manlutang", units: 3.0, finalGrade: 1.0, remarks: "Passed" },
  { courseCode: "IT 136", subjectName: "Capstone Project and Research 1", instructor: "J. Manlutang", units: 3.0, finalGrade: 1.0, remarks: "Passed" },
  { courseCode: "IT 137", subjectName: "Elective 3 – Integrative Programming", instructor: "J. Manlutang", units: 3.0, finalGrade: 1.0, remarks: "Passed" },
  { courseCode: "GE 103", subjectName: "Science, Technology, and Society", instructor: "J. Manlutang", units: 3.0, finalGrade: 1.0, remarks: "Passed" },
];

const StudentGrades = () => {
  const [selectedSemester, setSelectedSemester] = useState("1st Semester");
  const [selectedYear, setSelectedYear] = useState("2025-2026");
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const semesters = ["1st Semester", "2nd Semester", "Summer"];
  const academicYears = ["2025-2026", "2024-2025", "2023-2024"];

  useEffect(() => {
    setTimeout(() => {
      setGrades(sampleGrades);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-16 sm:max-[880px]:pt-20">
      <NavbarSimple />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-2 sm:mt-10 gap-4">
        <h1 className="pt-10 text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-6 sm:mb-8 font-outfit max-[880px]:mt-10">
          My Grades
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Semester Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="appearance-none w-full sm:w-auto bg-white text-gray-700 px-4 py-2 pr-8 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 cursor-pointer"
            >
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
            <IconChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-700 pointer-events-none" />
          </div>

          {/* Academic Year Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="appearance-none w-full sm:w-auto bg-white text-gray-700 px-4 py-2 pr-8 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 cursor-pointer"
            >
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <IconChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-700 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grades Table Section */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border-2 border-gray-200">
        {/* Semester Info */}
        <div className="px-4 sm:px-6 py-3  border-gray-200 ">
          <h2 className="text-base sm:text-lg font-medium text-gray-700">
            {selectedSemester}, S.Y. {selectedYear}
          </h2>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="">
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
              {grades.map((grade, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {grade.courseCode}
                  </td>
                  <td className="px-4 py-2 text-sm  whitespace-nowrap">
                    {grade.subjectName}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {grade.instructor}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {grade.units.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    {grade.finalGrade.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {grade.remarks}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm text-center sm:text-left">
          <div className="text-sm text-gray-600">Total Units</div>
          <div className="text-2xl font-semibold text-gray-900">
            {grades.reduce((sum, grade) => sum + grade.units, 0).toFixed(1)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm text-center sm:text-left">
          <div className="text-sm text-gray-600">Average Grade</div>
          <div className="text-2xl font-semibold text-gray-900">
            {(
              grades.reduce((sum, grade) => sum + grade.finalGrade, 0) /
              grades.length
            ).toFixed(2)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm text-center sm:text-left">
          <div className="text-sm text-gray-600">Total Subjects</div>
          <div className="text-2xl font-semibold text-gray-900">
            {grades.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;
