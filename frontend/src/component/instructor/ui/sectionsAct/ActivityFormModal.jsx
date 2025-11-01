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
      <div className="bg-white rounded-lg p-6 w-full max-w-xl mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isEdit ? "Edit Activity" : "Add Activity"}
        </h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
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
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => onChange({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
              >
                <option value="classStanding">Class Standing</option>
                <option value="laboratory">Laboratory</option>
                <option value="majorOutput">Major Output</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Score *
              </label>
              <input
                type="number"
                min={1}
                value={form.maxScore}
                onChange={(e) => onChange({ ...form, maxScore: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="flex-1 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {saving ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
