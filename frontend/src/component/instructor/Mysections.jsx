import React, { useState, useEffect } from "react";
import { 
  IconUsers,
  IconBook,
  IconX,
  IconAlertCircle,
  IconChalkboard,
  IconUserPlus,
  IconRefresh,
  IconClipboardList,
  IconCheck
} from "@tabler/icons-react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";

export default function MySections() {
  const [myAssignedSections, setMyAssignedSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [activityForm, setActivityForm] = useState({
    title: "",
    category: "classStanding" // classStanding, laboratory, majorOutput
  });

  // Fetch initial data
  useEffect(() => {
    fetchMyAssignedSections();
  }, []);

  const fetchMyAssignedSections = async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch("http://localhost:5000/api/instructor/sections");
      if (res.ok) {
        const data = await res.json();
        setMyAssignedSections(data.sections || []);
        setError(""); // Clear any previous errors
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

  const searchStudentsByStudid = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await authenticatedFetch(`http://localhost:5000/api/students/search?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.students || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error searching students:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInviteStudents = async () => {
    if (selectedStudents.length === 0) {
      setError("Please select at least one student to invite");
      return;
    }

    try {
      setSubmitting(true);
      const res = await authenticatedFetch(`http://localhost:5000/api/instructor/sections/${selectedSection._id}/invite-students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentIds: selectedStudents }),
      });

      if (res.ok) {
        const data = await res.json();
        setShowInviteModal(false);
        setSelectedStudents([]);
        setSelectedSection(null);
        await fetchMyAssignedSections(); // Refresh the sections
        alert(`Successfully invited ${data.invitedStudents?.length || selectedStudents.length} students to the section!`);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to invite students");
      }
    } catch (err) {
      setError("Error inviting students");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getSubjectName = (section) => {
    if (section.subject && typeof section.subject === 'object') {
      return `${section.subject.subjectCode} - ${section.subject.subjectName}`;
    }
    return 'Unknown Subject';
  };

  const openInviteModal = async (section) => {
    setSelectedSection(section);
    setShowInviteModal(true);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedStudents([]);
  };

  const openActivityModal = (section) => {
    setSelectedSection(section);
    setShowActivityModal(true);
    setActivityForm({
      title: "",
      category: "classStanding"
    });
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    if (!selectedSection) return;

    try {
      setSubmitting(true);
      const res = await authenticatedFetch(`http://localhost:5000/api/instructor/subjects/${selectedSection.subject._id}/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: activityForm.title,
          category: activityForm.category,
          maxScore: 100, // Default score
          sectionId: selectedSection._id
        }),
      });

      if (res.ok) {
        setShowActivityModal(false);
        alert("Activity created successfully!");
        setActivityForm({ title: "", category: "classStanding" });
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

  const handleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <IconAlertCircle className="text-red-500" size={20} />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Sections Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myAssignedSections.map((section) => (
              <div
                key={section._id}
                className="rounded-lg border border-blue-200 bg-blue-50/30 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <IconChalkboard className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {section.sectionName}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {section.schoolYear} - {section.term} Semester
                      </p>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                        Assigned to You
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <IconBook size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {getSubjectName(section)}
                    </span>
                  </div>
                  {section.students && (
                    <div className="flex items-center gap-2">
                      <IconUsers size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {section.students.length} Students Enrolled
                      </span>
                    </div>
                  )}
                  
                  {/* Show subject details for assigned sections */}
                  {section.subject && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800">Subject Details:</p>
                      <p className="text-sm text-blue-600">
                        Units: {section.subject.units || 'N/A'} | 
                        College: {section.subject.college || 'N/A'}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons for Assigned Sections */}
                  <div className="mt-4 pt-3 border-t border-blue-100 space-y-2">
                    <button
                      onClick={() => openInviteModal(section)}
                      className="w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <IconUserPlus size={16} />
                      Invite Students
                    </button>
                    <button
                      onClick={() => openActivityModal(section)}
                      className="w-full bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <IconClipboardList size={16} />
                      Add Activity
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Created: {new Date(section.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            
            {/* Empty state */}
            {myAssignedSections.length === 0 && (
              <div className="col-span-full text-center py-12">
                <IconChalkboard className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No sections assigned to you yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Contact your admin to get assigned to sections
                </p>
              </div>
            )}
          </div>
        )}

        {/* Invite Students Modal */}
        <Modal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Invite Students to Section"
        >
          <div className="space-y-4">
            {selectedSection && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Section Information:</h4>
                <p className="text-sm text-blue-600">
                  <strong>Subject:</strong> {getSubjectName(selectedSection)}
                </p>
                <p className="text-sm text-blue-600">
                  <strong>Section:</strong> {selectedSection.sectionName}
                </p>
                <p className="text-sm text-blue-600">
                  <strong>Current Students:</strong> {selectedSection.students?.length || 0}
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Students by Student ID or Email:
              </label>
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchStudentsByStudid(e.target.value);
                    }}
                    placeholder="Enter student ID or email (e.g., 2021-001234 or 2301106754@student.buksu.edu.ph)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Type the student's ID number or institutional email address to search
                </p>
              </div>
              
              <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
                {searchQuery.trim() === "" ? (
                  <div className="p-4 text-center text-gray-500">
                    <IconUsers className="mx-auto mb-2 text-gray-300" size={24} />
                    <p>Enter a student ID or email to search for students</p>
                    <p className="text-xs mt-1">Examples: 2021-001234 or 2301106754@student.buksu.edu.ph</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-2 space-y-2">
                    {searchResults.map((student) => (
                      <label
                        key={student._id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => handleStudentSelection(student._id)}
                          className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {student.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {student.studid} • {student.yearLevel} • {student.course}
                          </div>
                          <div className="text-xs text-blue-600">
                            Email: {student.email}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : !isSearching && searchQuery.trim() !== "" ? (
                  <div className="p-4 text-center text-gray-500">
                    <IconAlertCircle className="mx-auto mb-2 text-orange-400" size={24} />
                    <p>No students found for: "{searchQuery}"</p>
                    <p className="text-xs mt-1">Please check the student ID or email and try again</p>
                  </div>
                ) : null}
              </div>
              {selectedStudents.length > 0 && (
                <p className="text-sm text-blue-600 mt-2">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700">
                📧 Selected students will receive email invitations with section details and login instructions.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedStudents([]);
                  setSelectedSection(null);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleInviteStudents}
                disabled={submitting || selectedStudents.length === 0}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending Invites...
                  </>
                ) : (
                  <>
                    <IconUsers size={16} />
                    Invite {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Title *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Type *
              </label>
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

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-700">
                💡 <strong>Note:</strong> The activity will be available for all students in this section. 
                You can set scores and manage grades later in the Grade Management section.
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
      </div>
    </div>
  );
}