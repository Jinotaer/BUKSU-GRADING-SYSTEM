import React from "react";
import { IconCheck } from "@tabler/icons-react";

export function SectionForm({
  formData,
  filteredSubjects,
  semesters,
  instructors,
  gradingTotal,
  isEdit,
  onSubmit,
  onChange,
  onSchemaChange,
  onCancel,
  submitting, // <-- Add this line
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Semester *
        </label>
        <select
          name="semesterId"
          value={formData.semesterId}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
          required
        >
          <option value="">Select Semester</option>
          {semesters.map((semester) => (
            <option key={semester._id} value={semester._id}>
              {semester.schoolYear} - {semester.term} Semester
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject *
        </label>
        <select
          name="subjectId"
          value={formData.subjectId}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
          required
          disabled={!formData.semesterId}
        >
          <option value="">Select Subject</option>
          {filteredSubjects.map((subject) => (
            <option key={subject._id} value={subject._id}>
              {subject.subjectCode} - {subject.subjectName} ({subject.units}{" "}
              units)
            </option>
          ))}
        </select>
        {!formData.semesterId && (
          <p className="text-xs text-gray-500 mt-1">
            Please select a semester first
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructor *
        </label>
        <select
          name="instructorId"
          value={formData.instructorId}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
          required
        >
          <option value="">Select Instructor</option>
          {instructors.map((instructor) => (
            <option key={instructor._id} value={instructor._id}>
              {instructor.fullName} - {instructor.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Code *
        </label>
        <input
          type="text"
          name="sectionName"
          value={formData.sectionName}
          onChange={onChange}
          autoComplete="off"
          placeholder="e.g., BSCS 1A, BSIT 2B"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
          required
        />
      </div>

      {/* Grading Schema */}
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
              value={formData.gradingSchema.classStanding}
              onChange={onSchemaChange}
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
              value={formData.gradingSchema.laboratory}
              onChange={onSchemaChange}
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
              value={formData.gradingSchema.majorOutput}
              onChange={onSchemaChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
            />
          </div>
        </div>
        <p
          className={`text-xs mt-1 ${
            gradingTotal === 100 ? "text-green-600" : "text-orange-600"
          }`}
        >
          Total: {gradingTotal}%
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-blue-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base font-medium shadow-sm hover:shadow-md touch-manipulation"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{isEdit ? "Updating..." : "Adding..."}</span>
            </>
          ) : (
            <>
              <IconCheck size={16} className="flex-shrink-0" />
              <span>{isEdit ? "Update Section" : "Add Section"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
