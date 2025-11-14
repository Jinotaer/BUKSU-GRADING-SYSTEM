import React, { useState, useEffect } from "react";
import { IconCheck } from "@tabler/icons-react";
import { getDepartmentsByCollege } from "./departmrntData";

export function SubjectForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  isEdit = false,
  collegeOptions,
  semesters,
}) {
  const [departmentOptions, setDepartmentOptions] = useState([]);

  // Update department options when college changes
  useEffect(() => {
    if (formData.college) {
      const departments = getDepartmentsByCollege(formData.college);
      setDepartmentOptions(departments);
    } else {
      setDepartmentOptions([]);
    }
  }, [formData.college]);
  return (
    <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Subject Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="subjectCode"
            value={formData.subjectCode}
            onChange={onChange}
            autoComplete="off"
            className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400"
            placeholder="e.g. CS101"
            required
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Units <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="units"
            min="1"
            max="6"
            value={formData.units}
            onChange={onChange}
            className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
          Subject Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="subjectName"
          value={formData.subjectName}
          onChange={onChange}
          autoComplete="off"
          className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400"
          placeholder="e.g. Introduction to Computer Science"
          required
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
          College <span className="text-red-500">*</span>
        </label>
        <select
          name="college"
          value={formData.college}
          onChange={onChange}
          className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400 bg-white cursor-pointer"
          required
        >
          <option value="">Select College</option>
          {collegeOptions.map((college) => (
            <option key={college} value={college}>
              {college}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
          Department <span className="text-red-500">*</span>
        </label>
        {formData.college && departmentOptions.length > 0 ? (
          <select
            name="department"
            value={formData.department}
            onChange={onChange}
            className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400 bg-white cursor-pointer"
            required
          >
            <option value="">Select Department</option>
            {departmentOptions.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={onChange}
            autoComplete="off"
            placeholder={
              formData.college
                ? "No departments available"
                : "Select a college first"
            }
            readOnly={!formData.college}
            className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400"
            required
          />
        )}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
          Semester <span className="text-red-500">*</span>
        </label>
        <select
          name="semester"
          value={formData.semester}
          onChange={onChange}
          className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none text-sm sm:text-base transition-shadow hover:border-gray-400 bg-white cursor-pointer"
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

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 mt-4 sm:mt-5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm sm:text-base font-medium touch-manipulation cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-blue-600 text-white px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base font-medium shadow-sm hover:shadow-md touch-manipulation cursor-pointer"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{isEdit ? "Updating..." : "Adding..."}</span>
            </>
          ) : (
            <>
              <IconCheck size={16} className="flex-shrink-0" />
              <span>{isEdit ? "Update Subject" : "Add Subject"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
