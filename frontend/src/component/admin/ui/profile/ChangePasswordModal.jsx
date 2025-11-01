import React from "react";

export function ChangePasswordModal({
  show,
  passwordForm,
  passwordLoading,
  onClose,
  onSubmit,
  onChange,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  onChange({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  onChange({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  onChange({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500">
              Password must be at least 8 characters long
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-4 py-2 bg-buksu-primary hover:bg-buksu-secondary disabled:bg-blue-400 text-white rounded-md font-medium transition-colors disabled:cursor-not-allowed flex items-center gap-2"
              >
                {passwordLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>
                )}
                Change Password
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
