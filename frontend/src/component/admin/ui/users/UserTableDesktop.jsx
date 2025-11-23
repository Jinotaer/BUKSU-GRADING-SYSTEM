import React from "react";
import { IconArchive } from "@tabler/icons-react";

export function UserTableDesktop({ users, onArchive, getStatusBadge }) {
  return (
    <div className="hidden xl:block overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
              ID
            </th>
            <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Name
            </th>
            <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Email
            </th>
            <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
              College
            </th>
            <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Department
            </th>
            <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Role
            </th>
            <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-2 lg:px-4 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {users.map((user, index) => (
            <tr
              key={`${user.userType}-${user._id}-${index}`}
              className="hover:bg-gray-50"
            >
              <td className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm font-sm truncate max-w-[80px]">
                {user.id}
              </td>
              <td className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm truncate max-w-[120px]">
                {user.name}
              </td>
              <td className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm text-blue-600 truncate max-w-[150px]">
                {user.email}
              </td>
              <td className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm truncate max-w-[100px]">
                {user.college}
              </td>
              <td className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm truncate max-w-[100px]">
                {user.department}
              </td>
              <td className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === "Student"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm">
                {getStatusBadge(user)}
              </td>
              <td className="px-2 lg:px-4 py-2 lg:py-3">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
