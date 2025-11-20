import React, { useState, useEffect, useMemo, useCallback } from "react";
import { NavbarSimple } from "./studentsidebar";
import { authenticatedFetch } from "../../utils/auth";
import {
  GradesHeader,
  GradesFilters,
  GradesTable,
  GradesSummary,
  ErrorMessage,
  LoadingState,
} from "./ui/grades";

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
        console.log('Received grades data:', data);
        console.log('Number of grades:', data.grades?.length);
        if (data.grades?.length > 0) {
          console.log('Sample grade:', data.grades[0]);
        }
        setGradesData(data.grades || []);
      } else {
        const errorData = await res.json();
        console.error('Error response:', errorData);
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
      
      // Term grades
      midtermGrade: item.grade?.midtermGrade,
      finalTermGrade: item.grade?.finalTermGrade,
      midtermEquivalentGrade: item.grade?.midtermEquivalentGrade,
      finalTermEquivalentGrade: item.grade?.finalTermEquivalentGrade,
      
      // Final grade
      finalGradeNumeric: item.grade?.finalGradeNumeric,
      equivalentGrade: item.grade?.equivalentGrade || item.grade?.finalGrade,
      finalGrade: item.grade?.equivalentGrade || item.grade?.finalGrade || 0,
      remarks: item.grade?.remarks || "No Grade",
      
      // Component averages (for reference)
      classStanding: item.grade?.classStanding || 0,
      laboratory: item.grade?.laboratory || 0,
      majorOutput: item.grade?.majorOutput || 0,
      
      sectionName: item.section?.sectionName || "N/A",
      hasLaboratory: item.grade?.hasLaboratory
    }));
  }, [gradesData]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <NavbarSimple />
        <div className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-16 sm:max-[880px]:pt-20">
          <LoadingState />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-16 sm:max-[880px]:pt-20">
      <NavbarSimple />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 mt-2 sm:mt-10 gap-4">
        <GradesHeader />

        <GradesFilters
          selectedSemester={selectedSemester}
          selectedYear={selectedYear}
          semesters={semesters}
          academicYears={academicYears}
          onSemesterChange={setSelectedSemester}
          onYearChange={setSelectedYear}
        />
      </div>

      <ErrorMessage error={error} />

      <GradesTable
        displayGrades={displayGrades}
        semesters={semesters}
        selectedSemester={selectedSemester}
        selectedYear={selectedYear}
      />

      <GradesSummary displayGrades={displayGrades} />
    </div>
  );
};

export default StudentGrades;
