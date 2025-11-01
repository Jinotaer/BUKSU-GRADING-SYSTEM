import React from "react";
import { IconBrandGoogle } from "@tabler/icons-react";

export function ScheduleModal({
  isOpen,
  scheduleForm,
  onScheduleChange,
  onClose,
  onExport,
  loading,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 bg-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-900">
            Class Schedule Information
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Please provide the class schedule details before exporting to Google
            Sheets
          </p>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4">
          <div className="space-y-4">
            {/* Day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={scheduleForm.day}
                onChange={(e) =>
                  onScheduleChange({ ...scheduleForm, day: e.target.value })
                }
                placeholder="e.g., MWF, TTH, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={scheduleForm.time}
                onChange={(e) =>
                  onScheduleChange({ ...scheduleForm, time: e.target.value })
                }
                placeholder="e.g., 7:30 AM - 10:00 AM"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Room */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={scheduleForm.room}
                onChange={(e) =>
                  onScheduleChange({ ...scheduleForm, room: e.target.value })
                }
                placeholder="e.g., Lab 3, Room 205, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Chairperson */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chairperson <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={scheduleForm.chairperson}
                onChange={(e) =>
                  onScheduleChange({
                    ...scheduleForm,
                    chairperson: e.target.value,
                  })
                }
                placeholder="e.g., Dr. Juan Dela Cruz"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Dean */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dean <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={scheduleForm.dean}
                onChange={(e) =>
                  onScheduleChange({ ...scheduleForm, dean: e.target.value })
                }
                placeholder="e.g., Dr. Maria Santos"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onExport}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <IconBrandGoogle size={18} />
                <span>Export to Google Sheets</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
