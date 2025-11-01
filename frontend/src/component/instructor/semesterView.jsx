import React, { useState, useEffect } from "react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";
import {
  PageHeader,
  ErrorMessage,
  LoadingSpinner,
  SemesterList,
  SemesterDetails,
} from "./ui/semesterView";

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
          `http://localhost:5000/api/instructor/sections?schoolYear=${selectedSemester.schoolYear}&term=${selectedSemester.term}&includeArchived=true`
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

  const handleManageGrades = (sectionId) => {
    window.location.href = `/instructor/grades?section=${sectionId}`;
  };

  const handleViewActivities = (sectionId) => {
    window.location.href = `/instructor/sections/${sectionId}/activities`;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <PageHeader onRefresh={fetchSemesters} loading={loading} />
            <ErrorMessage message={error} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SemesterList
                semesters={semesters}
                selectedSemester={selectedSemester}
                onSelectSemester={setSelectedSemester}
              />

              <div className="lg:col-span-2">
                <SemesterDetails
                  selectedSemester={selectedSemester}
                  sections={sections}
                  onManageGrades={handleManageGrades}
                  onViewActivities={handleViewActivities}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}