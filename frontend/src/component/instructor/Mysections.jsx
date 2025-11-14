import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import {
  PageHeader,
  FilterSection,
  ErrorMessage,
  LoadingSpinner,
  SectionCard,
  EmptyState,
  Modal,
  ActivityForm,
  ActivitiesList,
  ArchiveModal,
} from "./ui/mysections";

export default function MySections() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [myAssignedSections, setMyAssignedSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals & actions
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [sectionToArchive, setSectionToArchive] = useState(null);

  // New: Filters (from provided design)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSemester, setSelectedSemester] = useState("all");

  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Activities
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityFilter, setActivityFilter] = useState("all");
  const [activityForm, setActivityForm] = useState({
    title: "",
    description: "",
    notes: "",
    category: "classStanding",
    maxScore: 100,
    eventType: "quiz",
    location: "",
    startDateTime: "",
    endDateTime: "",
    syncToGoogleCalendar: false,
  });

  // Fetch initial data
  useEffect(() => {
    fetchMyAssignedSections();
  }, []);

  const fetchMyAssignedSections = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(
        "http://localhost:5000/api/instructor/sections"
      );
      if (res.ok) {
        const data = await res.json();
        setMyAssignedSections(data.sections || []);
        setError("");
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to fetch assigned sections");
      }
    } catch (err) {
      console.error("Error fetching assigned sections:", err);
      setError("Error fetching assigned sections");
    } finally {
      setLoading(false);
    }
  };

  // Derived options for filters
  const academicYears = useMemo(() => {
    const set = new Set(
      (myAssignedSections || []).map((s) => s.schoolYear).filter(Boolean)
    );
    const arr = Array.from(set).sort((a, b) => (a > b ? -1 : 1));
    return [{ value: "all", label: "All Years" }].concat(
      arr.map((y) => ({ value: y, label: y }))
    );
  }, [myAssignedSections]);

  const semesters = useMemo(() => {
    // Always show all possible semester options
    return [
      { value: "all", label: "All Semesters" },
      { value: "1st", label: "1st Semester" },
      { value: "2nd", label: "2nd Semester" },
      { value: "Summer", label: "Summer Semester" }
    ];
  }, []);

  // Apply filters
  const filteredSections = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return (myAssignedSections || []).filter((section) => {
      const matchesQuery = q
        ? [
            section.sectionName,
            section?.subject?.subjectName,
            section?.subject?.subjectCode,
          ]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        : true;
      const matchesYear = selectedYear === "all" || section.schoolYear === selectedYear;
      const matchesSem = selectedSemester === "all" || section.term === selectedSemester;
      return matchesQuery && matchesYear && matchesSem;
    });
  }, [myAssignedSections, searchTerm, selectedYear, selectedSemester]);


  const getSubjectName = (section) => {
    if (section.subject && typeof section.subject === "object") {
      return `${section.subject.subjectCode} - ${section.subject.subjectName}`;
    }
    return "Unknown Subject";
  };

  const openActivityModal = (section) => {
    setSelectedSection(section);
    setShowActivityModal(true);
    setActivityForm({
      title: "",
      description: "",
      instructions: "",
      category: "classStanding",
      maxScore: 100,
      dueDate: "",
    });
  };

  const handleSectionClick = (section) => {
    navigate(`/instructor/sections/${section._id}/activities`, {
      state: { section }
    });
  };

  const handleArchiveClick = (section, e) => {
    e.stopPropagation(); // Prevent card click
    setSectionToArchive(section);
    setShowArchiveModal(true);
  };

  const confirmArchive = async () => {
    if (!sectionToArchive) return;

    try {
      setArchiving(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/section/${sectionToArchive._id}/archive`,
        { method: "PUT" }
      );

      if (res.ok) {
        notifications.showSuccess("Section archived successfully!");
        setShowArchiveModal(false);
        setSectionToArchive(null);
        // Refresh the sections list
        await fetchMyAssignedSections();
      } else {
        const errorData = await res.json();
        notifications.showError(errorData.message || "Failed to archive section");
      }
    } catch (error) {
      console.error("Error archiving section:", error);
      notifications.showError("Error archiving section");
    } finally {
      setArchiving(false);
    }
  };

  const fetchSectionActivities = async (sectionId) => {
    try {
      setLoadingActivities(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/instructor/sections/${sectionId}/activities`
      );
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to fetch activities");
        setActivities([]);
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError("Error fetching activities");
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    if (!selectedSection) return;

    // Validate schedule fields
    if (!activityForm.startDateTime || !activityForm.endDateTime) {
      notifications.showError("Start and end date/time are required");
      return;
    }

    const startObj = new Date(activityForm.startDateTime);
    const endObj = new Date(activityForm.endDateTime);

    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
      notifications.showError("Invalid date/time format");
      return;
    }

    if (startObj >= endObj) {
      notifications.showError("End date/time must be after start date/time");
      return;
    }

    try {
      setSubmitting(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/instructor/subjects/${selectedSection.subject._id}/activities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: activityForm.title,
            description: activityForm.description,
            notes: activityForm.notes || "",
            category: activityForm.category,
            maxScore: parseInt(activityForm.maxScore),
            eventType: activityForm.eventType || "quiz",
            location: activityForm.location || "",
            startDateTime: activityForm.startDateTime,
            endDateTime: activityForm.endDateTime,
            syncToGoogleCalendar: activityForm.syncToGoogleCalendar || false,
            sectionId: selectedSection._id,
          }),
        }
      );

      if (res.ok) {
        setShowActivityModal(false);
        notifications.showSuccess("Activity created successfully!");
        setActivityForm({
          title: "",
          description: "",
          notes: "",
          category: "classStanding",
          maxScore: 100,
          eventType: "quiz",
          location: "",
          startDateTime: "",
          endDateTime: "",
          syncToGoogleCalendar: false,
        });
        if (showActivitiesModal) {
          await fetchSectionActivities(selectedSection._id);
        }
      } else {
        const data = await res.json();
        setError(data.message || "Failed to create activity");
      }
    } catch (err) {
      setError("Error creating activity");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "classStanding":
        return "bg-blue-100 text-blue-800";
      case "laboratory":
        return "bg-green-100 text-green-800";
      case "majorOutput":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case "classStanding":
        return "Class Standing";
      case "laboratory":
        return "Laboratory";
      case "majorOutput":
        return "Major Output";
      default:
        return category;
    }
  };

  return (
    <NotificationProvider notifications={notifications}>
      <div className="flex min-h-screen bg-gray-50">
        <InstructorSidebar />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        <PageHeader
          onRefresh={fetchMyAssignedSections}
          loading={loading}
        />

        <FilterSection
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedSemester={selectedSemester}
          onSemesterChange={setSelectedSemester}
          academicYears={academicYears}
          semesters={semesters}
        />

        <ErrorMessage message={error} />

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map((section) => (
              <SectionCard
                key={section._id}
                section={section}
                onClick={handleSectionClick}
                onArchive={handleArchiveClick}
              />
            ))}

            {filteredSections.length === 0 && (
              <EmptyState
                searchTerm={searchTerm}
                selectedYear={selectedYear}
                selectedSemester={selectedSemester}
              />
            )}
          </div>
        )}


        <Modal
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          title="Add New Activi ty"
        >
          <ActivityForm
            selectedSection={selectedSection}
            activityForm={activityForm}
            onFormChange={setActivityForm}
            onSubmit={handleActivitySubmit}
            onCancel={() => setShowActivityModal(false)}
            submitting={submitting}
            getSubjectName={getSubjectName}
          />
        </Modal>

        <Modal
          isOpen={showActivitiesModal}
          onClose={() => setShowActivitiesModal(false)}
          title="Section Activities"
        >
          <ActivitiesList
            selectedSection={selectedSection}
            activities={activities}
            loading={loadingActivities}
            activityFilter={activityFilter}
            onFilterChange={setActivityFilter}
            onAddActivity={() => openActivityModal(selectedSection)}
            getSubjectName={getSubjectName}
            getCategoryColor={getCategoryColor}
            getCategoryLabel={getCategoryLabel}
          />
        </Modal>

        <ArchiveModal
          isOpen={showArchiveModal}
          section={sectionToArchive}
          onClose={() => {
            setShowArchiveModal(false);
            setSectionToArchive(null);
          }}
          onConfirm={confirmArchive}
          loading={archiving}
        />
        </div>
      </div>
    </NotificationProvider>
  );
}
