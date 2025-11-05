import React, { useState, useEffect } from "react";
import { getDepartmentsByCollege } from "./departmrntData";

export function InviteInstructorModal({
  show,
  inviteData,
  onClose,
  onSubmit,
  onChange,
  colleges,
}) {
  const [departmentOptions, setDepartmentOptions] = useState([]);

  // Update department options when college changes
  useEffect(() => {
    if (inviteData.college) {
      const departments = getDepartmentsByCollege(inviteData.college);
      setDepartmentOptions(departments);
      // Reset department selection when college changes
      if (inviteData.department) {
        onChange({ ...inviteData, department: "" });
      }
    } else {
      setDepartmentOptions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteData.college]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Invite Instructor</h2>
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ID</label>
              <input
                type="text"
                placeholder=""
                value={inviteData.instructorid}
                onChange={(e) =>
                  onChange({ ...inviteData, instructorid: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded-md text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                placeholder="instructor@buksu.edu.ph"
                value={inviteData.email}
                onChange={(e) =>
                  onChange({ ...inviteData, email: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded-md text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={inviteData.fullName}
                onChange={(e) =>
                  onChange({ ...inviteData, fullName: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded-md text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">College</label>
              <select
                value={inviteData.college}
                onChange={(e) =>
                  onChange({ ...inviteData, college: e.target.value })
                }
                required
                className="w-full px-3 py-2 border rounded-md text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select college</option>
                {colleges.map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Department
              </label>
              {inviteData.college && departmentOptions.length > 0 ? (
                <select
                  value={inviteData.department}
                  onChange={(e) =>
                    onChange({ ...inviteData, department: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select department</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder={
                    inviteData.college
                      ? "No departments available"
                      : "Select a college first"
                  }
                  value={inviteData.department}
                  onChange={(e) =>
                    onChange({ ...inviteData, department: e.target.value })
                  }
                  required
                  readOnly={!inviteData.college}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
