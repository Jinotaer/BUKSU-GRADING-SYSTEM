import React, { useState, useEffect, useMemo, useCallback } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { NavbarSimple } from "./studentsidebar";
import { authenticatedFetch } from "../../utils/auth";

const StudentGrades = () => {
  const [selectedSemester, setSelectedSemester] = useState("1st");
  const [selectedYear, setSelectedYear] = useState("2024-2025");
  const [gradesData, setGradesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const semesters = [
    { value: "1st", label: "1st Semester" },
    { value: "2nd", label: "2nd Semester" },
    { value: "Summer", label: "Summer" }
  ];
  
  const academicYears = ["2024-2025", "2025-2026", "2023-2024", "2022-2023"];

  const fetchGrades = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams();
      if (selectedYear) params.append('schoolYear', selectedYear);
      if (selectedSemester) params.append('term', selectedSemester);

      const res = await authenticatedFetch(
        `http://localhost:5000/api/student/grades?${params.toString()}`
      );

      if (res.ok) {
        const data = await res.json();
        setGradesData(data.grades || []);
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to fetch grades");
        setGradesData([]);
      }
    } catch (err) {
      console.error("Error fetching grades:", err);
      setError("Error fetching grades");
      setGradesData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedSemester]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  // Transform grades data to match display format
  const displayGrades = useMemo(() => {
    return gradesData.map(item => ({
      courseCode: item.section?.subject?.subjectCode || "N/A",
      subjectName: item.section?.subject?.subjectName || "Unknown Subject",
      instructor: item.section?.instructor?.fullName || "N/A",
      units: item.section?.subject?.units || 0,
      finalGrade: item.grade?.finalGrade || 0,
      remarks: item.grade?.remarks || "No Grade",
      sectionName: item.section?.sectionName || "N/A",
      classStanding: item.grade?.classStanding || 0,
      laboratory: item.grade?.laboratory || 0,
      majorOutput: item.grade?.majorOutput || 0
    }));
  }, [gradesData]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <NavbarSimple />
        <div className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-16 sm:max-[880px]:pt-20">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
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
                <option key={semester.value} value={semester.value}>
                  {semester.label}
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

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Grades Table Section */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 border-2 border-gray-200">
        {/* Semester Info */}
        <div className="px-4 sm:px-6 py-3 border-gray-200">
          <h2 className="text-base sm:text-lg font-medium text-gray-700">
            {semesters.find(s => s.value === selectedSemester)?.label}, S.Y. {selectedYear}
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
                      {grade.finalGrade > 0 ? grade.finalGrade.toFixed(2) : "N/A"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        grade.remarks === "Passed" 
                          ? "bg-green-100 text-green-800" 
                          : grade.remarks === "Failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
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
                No grades found for {semesters.find(s => s.value === selectedSemester)?.label}, S.Y. {selectedYear}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm text-center sm:text-left border border-gray-200">
          <div className="text-sm text-gray-600">Total Units</div>
          <div className="text-2xl font-semibold text-gray-900">
            {displayGrades.reduce((sum, grade) => sum + grade.units, 0).toFixed(1)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm text-center sm:text-left border border-gray-200">
          <div className="text-sm text-gray-600">Average Grade</div>
          <div className="text-2xl font-semibold text-gray-900">
            {displayGrades.length > 0
              ? (
                  displayGrades
                    .filter(g => g.finalGrade > 0)
                    .reduce((sum, grade) => sum + grade.finalGrade, 0) /
                  displayGrades.filter(g => g.finalGrade > 0).length
                ).toFixed(2)
              : "N/A"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm text-center sm:text-left border border-gray-200">
          <div className="text-sm text-gray-600">Total Subjects</div>
          <div className="text-2xl font-semibold text-gray-900">
            {displayGrades.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;
