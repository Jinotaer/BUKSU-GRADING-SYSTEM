import React from "react";
import { IconCheck } from "@tabler/icons-react";

export function ActivityForm({
  selectedSection,
  activityForm,
  onFormChange,
  onSubmit,
  onCancel,
  submitting,
  getSubjectName,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {selectedSection && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-blue-800 mb-2">
            Section & Subject:
          </h4>
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
          onChange={(e) => onFormChange({ ...activityForm, title: e.target.value })}
          placeholder="e.g., Quiz 1, Assignment 2, Lab Exercise 3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={activityForm.description}
          onChange={(e) =>
            onFormChange({ ...activityForm, description: e.target.value })
          }
          placeholder="Brief description of the activity..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions
        </label>
        <textarea
          value={activityForm.instructions}
          onChange={(e) =>
            onFormChange({ ...activityForm, instructions: e.target.value })
          }
          placeholder="Detailed instructions for students..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity Type *
          </label>
          <select
            value={activityForm.category}
            onChange={(e) =>
              onFormChange({ ...activityForm, category: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="classStanding">Class Standing</option>
            <option value="laboratory">Laboratory</option>
            <option value="majorOutput">Major Output</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Score *
          </label>
          <input
            type="number"
            value={activityForm.maxScore}
            onChange={(e) =>
              onFormChange({ ...activityForm, maxScore: e.target.value })
            }
            placeholder="100"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Due Date (Optional)
        </label>
        <input
          type="datetime-local"
          value={activityForm.dueDate}
          onChange={(e) =>
            onFormChange({ ...activityForm, dueDate: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-yellow-50 p-3 rounded-lg">
        <p className="text-sm text-yellow-700">
          💡 <strong>Note:</strong> The activity will be available for all
          students in this section. You can set scores and manage grades later
          in the Grade Management section.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
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
  );
}
