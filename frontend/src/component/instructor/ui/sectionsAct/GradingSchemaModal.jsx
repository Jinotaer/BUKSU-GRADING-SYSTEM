import React, { useState, useEffect } from "react";
import { IconX, IconCheck } from "@tabler/icons-react";

export function GradingSchemaModal({ isOpen, onClose, section, onSubmit, submitting }) {
  const [gradingSchema, setGradingSchema] = useState({
    classStanding: 40,
    laboratory: 30,
    majorOutput: 30,
  });

  // Initialize form with section's current grading schema
  useEffect(() => {
    if (section?.gradingSchema) {
      setGradingSchema({
        classStanding: section.gradingSchema.classStanding || 40,
        laboratory: section.gradingSchema.laboratory || 30,
        majorOutput: section.gradingSchema.majorOutput || 30,
      });
    }
  }, [section]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10) || 0;
    setGradingSchema((prev) => ({
      ...prev,
      [name]: numValue,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const total = gradingSchema.classStanding + gradingSchema.laboratory + gradingSchema.majorOutput;
    
    if (total !== 100) {
      return; // Let the parent component handle the error
    }
    
    onSubmit(gradingSchema);
  };

  const total = gradingSchema.classStanding + gradingSchema.laboratory + gradingSchema.majorOutput;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Grading Schema
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Semester - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester *
              </label>
              <select
                value={section ? `${section.schoolYear} - ${section.term} Semester` : ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
              >
                <option value={section ? `${section.schoolYear} - ${section.term} Semester` : ""}>
                  {section ? `${section.schoolYear} - ${section.term} Semester` : "Select Semester"}
                </option>
              </select>
            </div>

            {/* Subject - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={section?.subject ? `${section.subject.subjectCode} - ${section.subject.subjectName} (${section.subject.units} units)` : ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
              >
                <option value={section?.subject ? `${section.subject.subjectCode} - ${section.subject.subjectName} (${section.subject.units} units)` : ""}>
                  {section?.subject ? `${section.subject.subjectCode} - ${section.subject.subjectName} (${section.subject.units} units)` : "Select Subject"}
                </option>
              </select>
            </div>

            {/* Instructor - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructor *
              </label>
              <select
                value={section?.instructor ? `${section.instructor.fullName} - ${section.instructor.email}` : ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
              >
                <option value={section?.instructor ? `${section.instructor.fullName} - ${section.instructor.email}` : ""}>
                  {section?.instructor ? `${section.instructor.fullName} - ${section.instructor.email}` : "Select Instructor"}
                </option>
              </select>
            </div>

            {/* Section Code - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Code *
              </label>
              <input
                type="text"
                value={section?.sectionName || ""}
                disabled
                placeholder="e.g., BSCS 1A, BSIT 2B"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none"
              />
            </div>

            {/* Grading Schema - Editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grading Schema (Percentages - must total 100%)
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Class Standing
                  </label>
                  <input
                    type="number"
                    name="classStanding"
                    min="0"
                    max="100"
                    value={gradingSchema.classStanding}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Laboratory
                  </label>
                  <input
                    type="number"
                    name="laboratory"
                    min="0"
                    max="100"
                    value={gradingSchema.laboratory}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Major Output
                  </label>
                  <input
                    type="number"
                    name="majorOutput"
                    min="0"
                    max="100"
                    value={gradingSchema.majorOutput}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
              </div>
              <p className={`text-xs mt-1 ${
                total === 100 ? "text-green-600" : "text-orange-600"
              }`}>
                Total: {total}%
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || total !== 100}
                className="flex-1 bg-blue-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base font-medium shadow-sm hover:shadow-md touch-manipulation"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <IconCheck size={16} className="flex-shrink-0" />
                    <span>Update</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}