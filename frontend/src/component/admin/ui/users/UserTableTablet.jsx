import React from "react";
import { IconArchive } from "@tabler/icons-react";

export function UserTableTablet({ users, onArchive, getStatusBadge }) {
  return (
    <div className="hidden md:block xl:hidden overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Name
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Email
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              College
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Role
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
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
              <td className="px-3 py-2 text-sm">
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-gray-500">ID: {user.id}</div>
              </td>
              <td className="px-3 py-2 text-sm text-blue-600 truncate max-w-[150px]">
                {user.email}
              </td>
              <td className="px-3 py-2 text-sm">
                <div>{user.college}</div>
                <div className="text-xs text-gray-500">{user.department}</div>
              </td>
              <td className="px-3 py-2 text-sm">
                <div className="flex flex-col gap-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
                      user.role === "Student"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {user.role}
                  </span>
                  {getStatusBadge(user)}
                </div>
              </td>
              <td className="px-3 py-2">
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
