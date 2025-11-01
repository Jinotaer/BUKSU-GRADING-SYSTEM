import React from "react";
import { IconCheck } from "@tabler/icons-react";
import { SchoolYearCombo } from "./SchoolYearCombo";

export function SemesterForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  submitting,
  isEdit = false,
  schoolYearOptions,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor={isEdit ? "schoolYearEdit" : "schoolYearAdd"}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          School Year
        </label>
        <SchoolYearCombo
          id={isEdit ? "schoolYearEdit" : "schoolYearAdd"}
          value={formData.schoolYear}
          onChange={(v) => setFormData({ ...formData, schoolYear: v })}
          options={schoolYearOptions}
          required
        />
      </div>

      <div>
        <label
          htmlFor={isEdit ? "termEdit" : "termAdd"}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Term
        </label>
        <select
          id={isEdit ? "termEdit" : "termAdd"}
          value={formData.term}
          onChange={(e) => setFormData({ ...formData, term: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="1st">1st Semester</option>
          <option value="2nd">2nd Semester</option>
          <option value="Summer">Summer</option>
        </select>
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
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {isEdit ? "Updating..." : "Adding..."}
            </>
          ) : (
            <>
              <IconCheck size={16} />
              {isEdit ? "Update Semester" : "Add Semester"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
