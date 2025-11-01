import React from "react";
import { IconArchive } from "@tabler/icons-react";

export function UserCardMobile({ users, onArchive, getStatusBadge }) {
  return (
    <div className="md:hidden space-y-3">
      {users.map((user, index) => (
        <div
          key={`${user.userType}-${user._id}-${index}`}
          className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm truncate">
                  {user.name}
                </h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === "Student"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {user.role}
                  </span>
                  {getStatusBadge(user)}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    onArchive(user._id || user.id, user.role.toLowerCase())
                  }
                  className="inline-flex items-center px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >
                  <IconArchive className="w-3 h-3 mr-1" />
                  Archive
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <div>
                  <span className="font-medium">ID:</span> {user.id}
                </div>
                <div className="break-all">
                  <span className="font-medium">Email:</span>{" "}
                  <span className="text-blue-600">{user.email}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <div>
                  <span className="font-medium">College:</span> {user.college}
                </div>
                <div>
                  <span className="font-medium">Dept:</span> {user.department}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
