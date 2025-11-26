import React from "react";
import { IconArchive } from "@tabler/icons-react";

export function InstructorTable({ instructors, onArchive }) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              College
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Department
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {instructors.map((inst, i) => (
            <tr
              key={`${inst.instructorid || inst._id || inst.id}-${i}`}
              className="hover:bg-gray-50"
            >
              <td className="px-4 py-3 text-xs md:text-sm">
                {inst.instructorid || inst._id || inst.id || "N/A"}
              </td>
              <td className="px-4 py-3 text-xs md:text-sm">
                {inst.fullName || inst.name || "N/A"}
              </td>
              <td className="px-4 py-3 text-xs md:text-sm text-blue-600 truncate">
                {inst.email || "N/A"}
              </td>
              <td className="px-4 py-3 text-xs md:text-sm">
                {inst.college || "N/A"}
              </td>
              <td className="px-4 py-3 text-xs md:text-sm">
                {inst.department || "N/A"}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onArchive(inst._id || inst.id)}
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
