import React, { useState, useEffect, useCallback } from "react";
import {
  IconUsers,
  IconEdit,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconFilter,
  IconDownload
} from "@tabler/icons-react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";

export default function GradeManagement() {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingGrades, setEditingGrades] = useState({});
  const [filterTerm, setFilterTerm] = useState("");

  const fetchInstructorSections = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch("http://localhost:5000/api/instructor/sections");
      if (res.ok) {
        const data = await res.json();
        setSections(data.sections || []);
        if (data.sections && data.sections.length > 0) {
          setSelectedSection(data.sections[0]);
        }
      } else {
        setError("Failed to fetch sections");
      }
    } catch (err) {
      setError("Error fetching sections");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudentsAndGrades = useCallback(async () => {
    if (!selectedSection) return;

    try {
      setLoading(true);
      const res = await authenticatedFetch(
        `http://localhost:5000/api/instructor/sections/${selectedSection._id}/students`
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        
        // Initialize grades object
        const initialGrades = {};
        data.students?.forEach(student => {
          if (student.grade) {
            initialGrades[student._id] = {
              classStanding: student.grade.classStanding || 0,
              laboratory: student.grade.laboratory || 0,
              majorOutput: student.grade.majorOutput || 0,
              midtermGrade: student.grade.midtermGrade || 0,
              finalGrade: student.grade.finalGrade || 0,
              remarks: student.grade.remarks || ""
            };
          } else {
            initialGrades[student._id] = {
              classStanding: 0,
              laboratory: 0,
              majorOutput: 0,
              midtermGrade: 0,
              finalGrade: 0,
              remarks: ""
            };
          }
        });
        setGrades(initialGrades);
      }
    } catch (err) {
      setError("Error fetching students and grades");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedSection]);

  useEffect(() => {
    fetchInstructorSections();
  }, [fetchInstructorSections]);

  useEffect(() => {
    if (selectedSection) {
      fetchStudentsAndGrades();
    }
  }, [selectedSection, fetchStudentsAndGrades]);

  const calculateFinalGrade = (studentId, newGrades = null) => {
    if (!selectedSection?.gradingSchema) return 0;

    const studentGrades = newGrades || grades[studentId];
    if (!studentGrades) return 0;

    const { classStanding: csWeight, laboratory: labWeight, majorOutput: moWeight } = selectedSection.gradingSchema;

    const finalGrade = (
      (studentGrades.classStanding * (csWeight / 100)) +
      (studentGrades.laboratory * (labWeight / 100)) +
      (studentGrades.majorOutput * (moWeight / 100))
    );

    return Math.round(finalGrade * 100) / 100; // Round to 2 decimal places
  };

  const getRemarks = (finalGrade) => {
    if (finalGrade >= 75) return "Passed";
    if (finalGrade > 0 && finalGrade < 75) return "Failed";
    return "No Grade";
  };

  const handleGradeChange = (studentId, field, value) => {
    const numValue = Math.max(0, Math.min(100, parseFloat(value) || 0)); // Clamp between 0-100
    
    const newStudentGrades = {
      ...grades[studentId],
      [field]: numValue
    };

    const newGrades = {
      ...grades,
      [studentId]: newStudentGrades
    };

    // Calculate final grade automatically
    const finalGrade = calculateFinalGrade(studentId, newStudentGrades);
    newStudentGrades.finalGrade = finalGrade;
    newStudentGrades.remarks = getRemarks(finalGrade);

    setGrades(newGrades);
    
    // Mark as editing
    setEditingGrades(prev => ({
      ...prev,
      [studentId]: true
    }));
  };

  const saveGrade = async (studentId) => {
    try {
      setSaving(true);
      setError("");

      const studentGrades = grades[studentId];
      const res = await authenticatedFetch("http://localhost:5000/api/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          sectionId: selectedSection._id,
          classStanding: studentGrades.classStanding,
          laboratory: studentGrades.laboratory,
          majorOutput: studentGrades.majorOutput,
          midtermGrade: studentGrades.midtermGrade,
          finalGrade: studentGrades.finalGrade,
          remarks: studentGrades.remarks
        }),
      });

      if (res.ok) {
        setEditingGrades(prev => ({
          ...prev,
          [studentId]: false
        }));
        setSuccess(`Grade saved for ${students.find(s => s._id === studentId)?.fullName}`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to save grade");
      }
    } catch (err) {
      setError("Error saving grade");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const saveAllGrades = async () => {
    try {
      setSaving(true);
      setError("");

      const savePromises = Object.keys(editingGrades)
        .filter(studentId => editingGrades[studentId])
        .map(async (studentId) => {
          const studentGrades = grades[studentId];
          return authenticatedFetch("http://localhost:5000/api/grade", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              studentId,
              sectionId: selectedSection._id,
              classStanding: studentGrades.classStanding,
              laboratory: studentGrades.laboratory,
              majorOutput: studentGrades.majorOutput,
              midtermGrade: studentGrades.midtermGrade,
              finalGrade: studentGrades.finalGrade,
              remarks: studentGrades.remarks
            }),
          });
        });

      const results = await Promise.allSettled(savePromises);
      const failed = results.filter(result => result.status === 'rejected').length;

      if (failed === 0) {
        setEditingGrades({});
        setSuccess("All grades saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(`${failed} grades failed to save. Please try again.`);
      }
    } catch (err) {
      setError("Error saving grades");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const exportGrades = () => {
    if (!selectedSection || students.length === 0) return;

    const csvContent = [
      // Header
      ["Student ID", "Student Name", "Class Standing", "Laboratory", "Major Output", "Midterm", "Final Grade", "Remarks"].join(","),
      // Data rows
      ...students.map(student => {
        const studentGrades = grades[student._id] || {};
        return [
          student.studid || "",
          `"${student.fullName}"`,
          studentGrades.classStanding || 0,
          studentGrades.laboratory || 0,
          studentGrades.majorOutput || 0,
          studentGrades.midtermGrade || 0,
          studentGrades.finalGrade || 0,
          `"${studentGrades.remarks || 'No Grade'}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSection.sectionName}_${selectedSection.schoolYear}_${selectedSection.term}_grades.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(filterTerm.toLowerCase()) ||
    (student.studid && student.studid.toLowerCase().includes(filterTerm.toLowerCase()))
  );

  if (loading && !selectedSection) {
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
              Grade Management
            </h2>
            <p className="text-gray-600 mt-1">Manage student grades and generate reports</p>
          </div>
          <div className="flex gap-2">
            {Object.keys(editingGrades).some(key => editingGrades[key]) && (
              <button
                onClick={saveAllGrades}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <IconSave size={20} />
                )}
                Save All Changes
              </button>
            )}
            <button
              onClick={exportGrades}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              disabled={!selectedSection || students.length === 0}
            >
              <IconDownload size={20} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <IconAlertCircle className="text-red-500" size={20} />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <IconCheck className="text-green-500" size={20} />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {/* Section Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Section
              </label>
              <select
                value={selectedSection?._id || ""}
                onChange={(e) => {
                  const section = sections.find(s => s._id === e.target.value);
                  setSelectedSection(section);
                  setGrades({});
                  setEditingGrades({});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a section</option>
                {sections.map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.subject?.subjectCode} - {section.sectionName} ({section.schoolYear} {section.term} Semester)
                  </option>
                ))}
              </select>
            </div>

            {selectedSection && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Students
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or student ID..."
                    value={filterTerm}
                    onChange={(e) => setFilterTerm(e.target.value)}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <IconFilter className="absolute left-3 top-2.5 text-gray-400" size={16} />
                </div>
              </div>
            )}
          </div>

          {selectedSection && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Section Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Subject:</span>{" "}
                  {selectedSection.subject?.subjectCode} - {selectedSection.subject?.subjectName}
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Section:</span>{" "}
                  {selectedSection.sectionName}
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Students:</span>{" "}
                  {students.length}
                </div>
              </div>
              <div className="mt-2">
                <span className="text-blue-600 font-medium">Grading Schema:</span>{" "}
                Class Standing ({selectedSection.gradingSchema?.classStanding}%), 
                Laboratory ({selectedSection.gradingSchema?.laboratory}%), 
                Major Output ({selectedSection.gradingSchema?.majorOutput}%)
              </div>
            </div>
          )}
        </div>

        {/* Grades Table */}
        {selectedSection && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Student Grades</h3>
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredStudents.length} of {students.length} students
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-700">Student</th>
                      <th className="text-center p-4 font-medium text-gray-700">Class Standing</th>
                      <th className="text-center p-4 font-medium text-gray-700">Laboratory</th>
                      <th className="text-center p-4 font-medium text-gray-700">Major Output</th>
                      <th className="text-center p-4 font-medium text-gray-700">Final Grade</th>
                      <th className="text-center p-4 font-medium text-gray-700">Remarks</th>
                      <th className="text-center p-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => {
                      const studentGrades = grades[student._id] || {};
                      const isEditing = editingGrades[student._id];
                      const finalGrade = calculateFinalGrade(student._id);
                      const remarks = getRemarks(finalGrade);

                      return (
                        <tr key={student._id} className={isEditing ? "bg-yellow-50" : ""}>
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-gray-900">{student.fullName}</div>
                              <div className="text-sm text-gray-500">{student.studid}</div>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={studentGrades.classStanding || ""}
                              onChange={(e) => handleGradeChange(student._id, "classStanding", e.target.value)}
                              className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={studentGrades.laboratory || ""}
                              onChange={(e) => handleGradeChange(student._id, "laboratory", e.target.value)}
                              className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={studentGrades.majorOutput || ""}
                              onChange={(e) => handleGradeChange(student._id, "majorOutput", e.target.value)}
                              className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-4 text-center">
                            <div className={`font-medium ${
                              finalGrade >= 75 ? "text-green-600" : 
                              finalGrade > 0 ? "text-red-600" : "text-gray-400"
                            }`}>
                              {finalGrade > 0 ? finalGrade.toFixed(2) : "—"}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              remarks === "Passed" ? "bg-green-100 text-green-800" :
                              remarks === "Failed" ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {remarks}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {isEditing ? (
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() => saveGrade(student._id)}
                                  disabled={saving}
                                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="Save"
                                >
                                  <IconCheck size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingGrades(prev => ({
                                      ...prev,
                                      [student._id]: false
                                    }));
                                    // Reset to original values
                                    fetchStudentsAndGrades();
                                  }}
                                  disabled={saving}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Cancel"
                                >
                                  <IconX size={16} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingGrades(prev => ({
                                  ...prev,
                                  [student._id]: true
                                }))}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <IconEdit size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <IconUsers className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {filterTerm ? "No students match your search" : "No students in this section"}
                </h3>
                <p className="text-gray-500">
                  {filterTerm 
                    ? "Try adjusting your search terms" 
                    : "Invite students to this section to start grading"
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Grade Statistics */}
        {selectedSection && students.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {students.filter(student => {
                    const finalGrade = calculateFinalGrade(student._id);
                    return finalGrade >= 75;
                  }).length}
                </div>
                <div className="text-sm text-green-700">Passed</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {students.filter(student => {
                    const finalGrade = calculateFinalGrade(student._id);
                    return finalGrade > 0 && finalGrade < 75;
                  }).length}
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {students.filter(student => {
                    const finalGrade = calculateFinalGrade(student._id);
                    return finalGrade === 0;
                  }).length}
                </div>
                <div className="text-sm text-gray-700">No Grade</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {(() => {
                    const validGrades = students
                      .map(student => calculateFinalGrade(student._id))
                      .filter(grade => grade > 0);
                    return validGrades.length > 0 
                      ? (validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length).toFixed(2)
                      : "—";
                  })()}
                </div>
                <div className="text-sm text-blue-700">Class Average</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}