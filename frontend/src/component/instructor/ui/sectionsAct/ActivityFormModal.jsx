import React from "react";

export function ActivityFormModal({
  isOpen,
  isEdit,
  form,
  saving,
  onClose,
  onSubmit,
  onChange,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-xl mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEdit ? "Edit Activity" : "Add Activity"}
        </h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              required
              placeholder={isEdit ? "" : "e.g., Quiz 1, Lab Exercise 2"}
              className="w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none border border-gray-300 "
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                onChange({ ...form, description: e.target.value })
              }
              className="w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none border border-gray-300"   placeholder={isEdit ? "" : "Brief details or instructions"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              rows={2}
              value={form.notes || ""}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
               placeholder={isEdit ? "" : "Additional notes (optional)"}
              className="w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Term <span className="text-red-500">*</span>
            </label>
            <select
              name="term"
              value={form.term || "Midterm"}
              onChange={(e) => onChange({ ...form, term: e.target.value })}
              required
              className="w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none border border-gray-300 cursor-pointer"
            >
              <option value="Midterm">Mid Term</option>
              <option value="Finalterm">Final Term</option>
              <option value="Summer">Summer</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  onChange({ ...form, category: e.target.value })
                }
                className="w-full px-3 py-2  rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none border border-gray-300 cursor-pointer"
              >
                <option value="classStanding">Class Standing</option>
                <option value="laboratory">Laboratory</option>
                <option value="majorOutput">Major Output</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Score <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.maxScore}
                onChange={(e) =>
                  onChange({ ...form, maxScore: e.target.value })
                }
                className="w-full px-3 py-2  rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none border border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.eventType || "quiz"}
                onChange={(e) =>
                  onChange({ ...form, eventType: e.target.value })
                }
                required
                className="w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none border border-gray-300 cursor-pointer"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={form.location || ""}
                onChange={(e) =>
                  onChange({ ...form, location: e.target.value })
                }
                placeholder="e.g., Room 101, Online"
                className="w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none border border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.startDateTime || ""}
                onChange={(e) =>
                  onChange({ ...form, startDateTime: e.target.value })
                }
                required
                className="w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none border border-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.endDateTime || ""}
                onChange={(e) =>
                  onChange({ ...form, endDateTime: e.target.value })
                }
                required
                className="w-full px-3 py-2 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:outline-none border border-gray-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.syncToGoogleCalendar}
              onChange={(e) =>
                onChange({ ...form, syncToGoogleCalendar: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Sync to Google Calendar
            </label>
          </div>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded focus:ring-blue-600 focus:border-transparent focus:outline-none border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                !form.title.trim() ||
                !form.startDateTime ||
                !form.endDateTime
              }
              className="flex-1 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
