import React from "react";
import { IconCalendarEvent, IconEdit, IconArchive } from "@tabler/icons-react";

export function SemesterCard({
  semester,
  isLocked,
  lockedBy,
  onEdit,
  onArchive,
}) {
  const id = semester._id || semester.id;
  const locked = isLocked(id);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <IconCalendarEvent className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">
              {semester.schoolYear}
            </h3>
            <p className="text-gray-600 text-sm">{semester.term} Semester</p>
          </div>
        </div>

        <div className="flex gap-2">
          {locked && (
            <span
              className="flex gap-1 text-xs font-regular text-red-500 px-2 py-2"
              title={`Locked by ${lockedBy(id)}`}
              aria-live="polite"
            >
              Locked
            </span>
          )}
          <button
            onClick={() => onEdit(semester)}
            disabled={locked}
            className={`p-2 rounded-lg transition-colors ${
              locked
                ? "text-gray-300 cursor-not-allowed bg-gray-50"
                : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
            }`}
            title={locked ? `Locked by ${lockedBy(id)}` : "Edit semester"}
          >
            <IconEdit size={16} />
          </button>
          <button
            onClick={() => onArchive(id)}
            disabled={locked}
            className={`p-2 rounded-lg transition-colors ${
              locked
                ? "text-gray-300 cursor-not-allowed bg-gray-50"
                : "text-gray-400 hover:text-red-600 hover:bg-red-50"
            }`}
            title={locked ? `Locked by ${lockedBy(id)}` : "Archive semester"}
          >
            <IconArchive size={16} />
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-500">
        Created: {new Date(semester.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
