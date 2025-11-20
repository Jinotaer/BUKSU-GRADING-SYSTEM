import React, { useMemo } from "react";
import { IconX, IconDeviceFloppy } from "@tabler/icons-react";
import { departmentsData, getDepartmentsByCollege } from "./departmrntData";

export function EditProfileModal({
  isOpen,
  editForm,
  submitting,
  onClose,
  onSubmit,
  onChange,
}) {
  // compute options using hooks at top-level (unconditional) to satisfy Rules of Hooks
  const collegeOptions = useMemo(() => Object.keys(departmentsData), []);
  const departmentOptions = useMemo(
    () => getDepartmentsByCollege(editForm.college || ""),
    [editForm.college]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={editForm.fullName}
                onChange={(e) =>
                  onChange({ ...editForm, fullName: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  College
                </label>
                <select
                  value={editForm.college || ""}
                  onChange={(e) => {
                    // reset department when college changes (match student modal behavior)
                    onChange({ ...editForm, college: e.target.value, department: "" });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  <option value="">Select college (or leave blank)</option>
                  {collegeOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>

                {/* Always show a select for department; disable until college is selected (student modal behavior) */}
                <select
                  value={editForm.department || ""}
                  onChange={(e) => onChange({ ...editForm, department: e.target.value })}
                  disabled={!editForm.college}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  <option value="">Select department</option>
                  {departmentOptions.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-600">
                  💡 Your email and profile picture are managed through your
                  Google Workspace account and cannot be changed here.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <IconDeviceFloppy size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
        </form>
      </div>
    </div>
  );
}

