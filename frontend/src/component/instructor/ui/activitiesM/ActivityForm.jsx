import React from "react";
import { IconCheck } from "@tabler/icons-react";

const categories = [
  { key: "classStanding", label: "Class Standing" },
  { key: "laboratory", label: "Laboratory" },
  { key: "majorOutput", label: "Major Output" },
];

export function ActivityForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  sections,
  onToggleSection,
  isEditMode = false,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={onChange}
          autoComplete="off"
          placeholder={isEditMode ? "" : "e.g., Quiz 1, Lab Exercise 2"}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onChange}
          rows={3}
          placeholder={isEditMode ? "" : "Brief details or instructions"}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Score
          </label>
          <input
            type="number"
            name="maxScore"
            min="0"
            value={formData.maxScore}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assign to Sections
        </label>
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-white">
          {sections.length === 0 ? (
            <p className="text-sm text-gray-500 p-2">
              No sections available.
            </p>
          ) : (
            sections.map((s) => (
              <label
                key={s._id || s.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={formData.sectionIds.includes(s._id || s.id)}
                  onChange={() => onToggleSection(s._id || s.id)}
                />
                <div className="text-sm">
                  <div className="text-gray-900 font-medium">
                    {s.sectionName}
                  </div>
                  <div className="text-gray-500">
                    {s.schoolYear} - {s.term} • {s.subject?.subjectCode}{" "}
                    {s.subject?.subjectName}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <IconCheck size={16} />
          {isEditMode ? "Update Activity" : "Add Activity"}
        </button>
      </div>
    </form>
  );
}
