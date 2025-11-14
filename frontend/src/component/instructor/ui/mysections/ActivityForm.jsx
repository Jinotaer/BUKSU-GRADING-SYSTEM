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
          Notes
        </label>
        <textarea
          value={activityForm.notes}
          onChange={(e) =>
            onFormChange({ ...activityForm, notes: e.target.value })
          }
          placeholder="Additional notes (optional)..."
          rows={2}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Type *
          </label>
          <select
            value={activityForm.eventType}
            onChange={(e) =>
              onFormChange({ ...activityForm, eventType: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            required
          >
            <option value="quiz">Quiz</option>
            <option value="laboratory">Laboratory</option>
            <option value="exam">Exam</option>
            <option value="assignment">Assignment</option>
            <option value="project">Project</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={activityForm.location}
            onChange={(e) =>
              onFormChange({ ...activityForm, location: e.target.value })
            }
            placeholder="e.g., Room 101, Online"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date & Time *
          </label>
          <input
            type="datetime-local"
            value={activityForm.startDateTime}
            onChange={(e) =>
              onFormChange({ ...activityForm, startDateTime: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date & Time *
          </label>
          <input
            type="datetime-local"
            value={activityForm.endDateTime}
            onChange={(e) =>
              onFormChange({ ...activityForm, endDateTime: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!activityForm.syncToGoogleCalendar}
          onChange={(e) =>
            onFormChange({ ...activityForm, syncToGoogleCalendar: e.target.checked })
          }
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label className="text-sm font-medium text-gray-700">
          Sync to Google Calendar
        </label>
      </div>

      <div className="bg-yellow-50 p-3 rounded-lg">
        <p className="text-sm text-yellow-700">
          💡 <strong>Note:</strong> The activity will be available for all
          students in this section. A schedule will be automatically created with the provided date/time.
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
          disabled={submitting || !activityForm.title.trim() || !activityForm.startDateTime || !activityForm.endDateTime}
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
