import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconUsers,
  IconBook,
  IconX,
  IconAlertCircle,
  IconChalkboard,
  IconUserPlus,
  IconRefresh,
  IconClipboardList,
  IconCheck,
  IconEye,
  IconPlus,
  IconCalendar,
  IconClock,
  IconTarget,
  IconArchive,
} from "@tabler/icons-react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";

export default function MySections() {
  const navigate = useNavigate();
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
    instructions: "",
    category: "classStanding",
    maxScore: 100,
    dueDate: "",
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
    const set = new Set((myAssignedSections || []).map((s) => s.term).filter(Boolean));
    const arr = Array.from(set);
    return [{ value: "all", label: "All Semesters" }].concat(
      arr.map((t) => ({ value: t, label: `${t} Semester` }))
    );
  }, [myAssignedSections]);

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
        alert("Section archived successfully!");
        setShowArchiveModal(false);
        setSectionToArchive(null);
        // Refresh the sections list
        await fetchMyAssignedSections();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to archive section");
      }
    } catch (error) {
      console.error("Error archiving section:", error);
      alert("Error archiving section");
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
            instructions: activityForm.instructions,
            category: activityForm.category,
            maxScore: parseInt(activityForm.maxScore),
            dueDate: activityForm.dueDate
              ? new Date(activityForm.dueDate).toISOString()
              : null,
            sectionId: selectedSection._id,
          }),
        }
      );

      if (res.ok) {
        setShowActivityModal(false);
        alert("Activity created successfully!");
        setActivityForm({
          title: "",
          description: "",
          instructions: "",
          category: "classStanding",
          maxScore: 100,
          dueDate: "",
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

  const filteredActivities = activities.filter((activity) => {
    if (activityFilter === "all") return true;
    return activity.category === activityFilter;
  });


  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <IconX size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-xl sm:text-2xl lg:text-3xl font-bold">
              My Assigned Sections
            </h2>
            <p className="text-gray-600 mt-1">View and manage your assigned class sections</p>
          </div>
          <button
            onClick={fetchMyAssignedSections}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <IconRefresh size={20} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Filters Section — applied from your design */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-5">
          <input
            type="text"
            placeholder="Search Class"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-buksu-primary focus:border-transparent"
          />

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Academic Year</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="min-w-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-buksu-primary focus:border-transparent"
              >
                {academicYears.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Semester</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="min-w-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-buksu-primary focus:border-transparent"
              >
                {semesters.map((semester) => (
                  <option key={semester.value} value={semester.value}>
                    {semester.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <IconAlertCircle className="text-red-500" size={20} />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Sections Grid — redesigned to your card layout */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map((section) => (
              <div
                key={section._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden border border-gray-100"
                onClick={() => handleSectionClick(section)}
              >
                {/* Image / Hero area */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-3xl font-bold mb-2">
                      {section?.subject?.subjectCode || "SUBJ"}
                    </div>
                    <div className="text-sm opacity-90">{section.sectionName}</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {section?.subject?.subjectName || "Untitled Subject"}
                  </h3>

                  <p className="text-gray-600 font-medium text-sm mb-3">
                    {section?.subject?.subjectCode} - {section.sectionName}
                  </p>

                  <div className="space-y-1 mb-4 text-sm">
                    <p className="text-gray-500">{section.term} Semester</p>
                    <p className="text-gray-500">A.Y. {section.schoolYear}</p>
                    {section?.subject?.units != null && (
                      <p className="text-gray-500">
                        {section.subject.units} {section.subject.units === 1 ? "Unit" : "Units"}
                      </p>
                    )}
                  </div>

                  <p className="text-gray-900 font-semibold text-sm">
                    {section.instructor?.fullName || "Assigned to You"}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {section?.subject?.college || "College"}
                      </span>
                      {Array.isArray(section.students) && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <IconUsers size={14} /> {section.students.length}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleArchiveClick(section, e)}
                      className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Archive Section"
                    >
                      <IconArchive size={18} />
                    </button>
                  </div>

                </div>
              </div>
            ))}

            {/* Empty state */}
            {filteredSections.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                  <IconChalkboard className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    {searchTerm || selectedYear !== "all" || selectedSemester !== "all"
                      ? "No sections match your filters"
                      : "No sections assigned to you yet"}
                  </h3>
                  <p className="text-gray-500 mb-2">
                    {searchTerm || selectedYear !== "all" || selectedSemester !== "all"
                      ? "Try adjusting your search or filter selections."
                      : "Contact your admin to get assigned to sections."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Add Activity Modal */}
        <Modal
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          title="Add New Activity"
        >
          <form onSubmit={handleActivitySubmit} className="space-y-4">
            {selectedSection && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-blue-800 mb-2">Section & Subject:</h4>
                <p className="text-sm text-blue-600">
                  <strong>Section:</strong> {selectedSection.sectionName}
                </p>
                <p className="text-sm text-blue-600">
                  <strong>Subject:</strong> {getSubjectName(selectedSection)}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Activity Title *</label>
              <input
                type="text"
                value={activityForm.title}
                onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                placeholder="e.g., Quiz 1, Assignment 2, Lab Exercise 3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Brief description of the activity..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
              <textarea
                value={activityForm.instructions}
                onChange={(e) => setActivityForm({ ...activityForm, instructions: e.target.value })}
                placeholder="Detailed instructions for students..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Activity Type *</label>
                <select
                  value={activityForm.category}
                  onChange={(e) => setActivityForm({ ...activityForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="classStanding">Class Standing</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="majorOutput">Major Output</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Score *</label>
                <input
                  type="number"
                  value={activityForm.maxScore}
                  onChange={(e) => setActivityForm({ ...activityForm, maxScore: e.target.value })}
                  placeholder="100"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (Optional)</label>
              <input
                type="datetime-local"
                value={activityForm.dueDate}
                onChange={(e) => setActivityForm({ ...activityForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-700">
                💡 <strong>Note:</strong> The activity will be available for all students in this section. You can set scores and manage grades later in the Grade Management section.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowActivityModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !activityForm.title.trim()}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <IconCheck size={16} />
                    Add Activity
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* View Activities Modal */}
        <Modal
          isOpen={showActivitiesModal}
          onClose={() => setShowActivitiesModal(false)}
          title="Section Activities"
        >
          <div className="space-y-4">
            {selectedSection && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-blue-800 mb-2">Section Information:</h4>
                <p className="text-sm text-blue-600">
                  <strong>Section:</strong> {selectedSection.sectionName}
                </p>
                <p className="text-sm text-blue-600">
                  <strong>Subject:</strong> {getSubjectName(selectedSection)}
                </p>
                <p className="text-sm text-blue-600">
                  <strong>Students:</strong> {selectedSection.students?.length || 0} enrolled
                </p>
              </div>
            )}

            {/* Filter and Add Activity Button */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'classStanding', label: 'Class Standing' },
                  { key: 'laboratory', label: 'Laboratory Activities' },
                  { key: 'majorOutput', label: 'Major Output' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActivityFilter(tab.key)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${activityFilter === tab.key ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => openActivityModal(selectedSection)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <IconPlus size={16} />
                Add Activity
              </button>
            </div>

            {/* Activities List */}
            {loadingActivities ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredActivities.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity._id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg mb-1">{activity.title}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                            activity.category
                          )}`}>
                            {getCategoryLabel(activity.category)}
                          </span>
                          <span className="text-sm text-gray-500">Max Score: {activity.maxScore}</span>
                        </div>
                      </div>
                    </div>

                    {activity.description && (
                      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                    )}

                    {activity.instructions && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Instructions:</p>
                        <p className="text-sm text-gray-600">{activity.instructions}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        {activity.dueDate && (
                          <div className="flex items-center gap-1">
                            <IconCalendar size={14} />
                            <span>Due: {new Date(activity.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <IconClock size={14} />
                          <span>
                            Created: {new Date(activity.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <IconTarget size={14} />
                        <span>{activity.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <IconClipboardList className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No activities found</h3>
                <p className="text-gray-500 mb-4">
                  {activityFilter === "all"
                    ? "This section has no activities yet."
                    : `No ${getCategoryLabel(activityFilter).toLowerCase()} activities found.`}
                </p>
                <button
                  onClick={() => openActivityModal(selectedSection)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <IconPlus size={16} />
                  Create First Activity
                </button>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowActivitiesModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>

        {/* Archive Confirmation Modal */}
        {showArchiveModal && sectionToArchive && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Archive Section</h3>
                <button
                  onClick={() => {
                    setShowArchiveModal(false);
                    setSectionToArchive(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg mb-4">
                  <IconArchive className="w-8 h-8 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {sectionToArchive.sectionName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {sectionToArchive.subject?.subjectCode} - {sectionToArchive.schoolYear}{" "}
                      {sectionToArchive.term}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 mb-2">
                  Are you sure you want to archive this section? It will be moved to your
                  archived sections and hidden from the active list.
                </p>
                <p className="text-sm text-gray-500">
                  Students enrolled: {sectionToArchive.students?.length || 0}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  You can restore it later from the Archive Management page.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowArchiveModal(false);
                    setSectionToArchive(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={archiving}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmArchive}
                  disabled={archiving}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {archiving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Archiving...</span>
                    </>
                  ) : (
                    <>
                      <IconArchive size={16} />
                      <span>Archive Section</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
