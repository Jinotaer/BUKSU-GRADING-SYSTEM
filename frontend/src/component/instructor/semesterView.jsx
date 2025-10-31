import React, { useState, useEffect } from "react";
import {
  IconCalendar,
  IconSchool,
  IconChevronRight,
  IconUsers,
  IconBook,
  IconRefresh,
  IconAlertCircle
} from "@tabler/icons-react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";

export default function SemesterView() {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    const fetchSectionsForSemester = async () => {
      if (!selectedSemester) return;

      try {
        const res = await authenticatedFetch(
          `http://localhost:5000/api/instructor/sections?schoolYear=${selectedSemester.schoolYear}&term=${selectedSemester.term}`
        );
        if (res.ok) {
          const data = await res.json();
          setSections(data.sections || []);
        }
      } catch (err) {
        console.error("Error fetching sections for semester:", err);
      }
    };

    if (selectedSemester) {
      fetchSectionsForSemester();
    }
  }, [selectedSemester]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch("http://localhost:5000/api/semesters");
      if (res.ok) {
        const data = await res.json();
        setSemesters(data.semesters || []);
        if (data.semesters && data.semesters.length > 0) {
          // Set current/latest semester as default
          setSelectedSemester(data.semesters[0]);
        }
      } else {
        setError("Failed to fetch semesters");
      }
    } catch (err) {
      setError("Error fetching semesters");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // const getSemesterStatus = (semester) => {
  //   const now = new Date();
  //   const currentYear = now.getFullYear();
  //   const currentMonth = now.getMonth() + 1; // 0-based to 1-based
    
  //   // Extract year from semester.schoolYear (e.g., "2024-2025" -> 2024)
  //   const [startYear] = semester.schoolYear.split('-').map(Number);
    
  //   // Determine if semester is current, past, or future
  //   if (startYear < currentYear) return "past";
  //   if (startYear > currentYear) return "future";
    
  //   // Same year - check term and month
  //   if (semester.term === "1st") {
  //     // 1st semester typically runs Aug-Dec (months 8-12)
  //     return currentMonth >= 8 ? "current" : "future";
  //   } else {
  //     // 2nd semester typically runs Jan-May (months 1-5)
  //     return currentMonth <= 5 ? "current" : "past";
  //   }
  // };

  // const getStatusColor = (status) => {
  //   switch (status) {
  //     case "current": return "bg-green-100 text-green-800 border-green-200";
  //     case "past": return "bg-gray-100 text-gray-800 border-gray-200";
  //     case "future": return "bg-blue-100 text-blue-800 border-blue-200";
  //     default: return "bg-gray-100 text-gray-800 border-gray-200";
  //   }
  // };

  // const getStatusLabel = (status) => {
  //   switch (status) {
  //     case "current": return "Current";
  //     case "past": return "Past";
  //     case "future": return "Upcoming";
  //     default: return "Unknown";
  //   }
  // };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <InstructorSidebar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-xl sm:text-2xl lg:text-3xl font-bold">
              Semester Overview
            </h2>
            <p className="text-gray-600 mt-1">View your sections across different semesters</p>
          </div>
          <button
            onClick={fetchSemesters}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <IconRefresh size={20} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <IconAlertCircle className="text-red-500" size={20} />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Semester List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Available Semesters</h3>
              <p className="text-sm text-gray-600 mt-1">Select a semester to view details</p>
            </div>
            <div className="p-4">
              {semesters.length > 0 ? (
                <div className="space-y-3">
                  {semesters.map((semester) => {
                    // const status = getSemesterStatus(semester);
                    const isSelected = selectedSemester?._id === semester._id;
                    
                    return (
                      <div
                        key={semester._id}
                        onClick={() => setSelectedSemester(semester)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                          isSelected 
                            ? "border-blue-500 bg-blue-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {semester.schoolYear}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {semester.term} Semester
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full border `}>
                              {/* ${getStatusColor(status)} */}
                              {/* {getStatusLabel(status)} */}
                            </span>
                            <IconChevronRight 
                              size={16} 
                              className={`transition-transform ${isSelected ? "rotate-90" : ""}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconCalendar className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500">No semesters available</p>
                </div>
              )}
            </div>
          </div>

          {/* Semester Details */}
          <div className="lg:col-span-2">
            {selectedSemester ? (
              <div className="space-y-6">
                {/* Semester Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedSemester.schoolYear} - {selectedSemester.term} Semester
                    </h3>
                    <span className={`px-3 py-1 text-sm rounded-full border `}>
                      {/* ${getStatusColor(getSemesterStatus(selectedSemester))} */}
                      {/* {getStatusLabel(getSemesterStatus(selectedSemester))} */}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <IconBook className="text-blue-600" size={20} />
                        <span className="text-sm font-medium text-blue-800">Sections</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        {sections.length}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <IconUsers className="text-green-600" size={20} />
                        <span className="text-sm font-medium text-green-800">Students</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">
                        {sections.reduce((total, section) => total + (section.students?.length || 0), 0)}
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <IconSchool className="text-purple-600" size={20} />
                        <span className="text-sm font-medium text-purple-800">Subjects</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">
                        {new Set(sections.map(section => section.subject?._id)).size}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sections List */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">Your Sections</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Sections you're teaching in this semester
                    </p>
                  </div>
                  
                  <div className="p-4">
                    {sections.length > 0 ? (
                      <div className="space-y-4">
                        {sections.map((section) => (
                          <div
                            key={section._id}
                            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {section.sectionName}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  {section.subject?.subjectCode} - {section.subject?.subjectName}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                  {section.students?.length || 0} Students
                                </p>
                                <p className="text-xs text-gray-500">
                                  {section.subject?.units} Units
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                                Created: {new Date(section.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => window.location.href = `/instructor/grades?section=${section._id}`}
                                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                                >
                                  Manage Grades
                                </button>
                                <button
                                  onClick={() => window.location.href = `/instructor/sections/${section._id}/activities`}
                                  className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                                >
                                  View Activities
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <IconBook className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-gray-500 mb-2">No sections for this semester</p>
                        <p className="text-sm text-gray-400">
                          You haven't been assigned any sections for this semester yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <div className="text-center">
                  <IconCalendar className="mx-auto text-gray-300 mb-4" size={64} />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Select a Semester
                  </h3>
                  <p className="text-gray-500">
                    Choose a semester from the list to view your sections and details.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}