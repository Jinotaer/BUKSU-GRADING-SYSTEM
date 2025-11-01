import React from "react";
import { IconArchive, IconArchiveOff } from "@tabler/icons-react";

export function ArchiveItem({ item, type, onArchive, onUnarchive }) {
  const isArchived = item.isArchived;

  const getItemTitle = () => {
    return (
      item.fullName ||
      item.subjectName ||
      item.sectionName ||
      `${item.schoolYear} - ${item.term}`
    );
  };

  const getItemSubtitle = () => {
    return (
      item.email ||
      item.subjectCode ||
      item.instructor?.fullName ||
      item.term
    );
  };

  return (
    <div
      className={`p-4 rounded-lg border ${
        isArchived
          ? "bg-gray-100 border-gray-300 opacity-75"
          : "bg-white border-gray-200"
      } hover:shadow-md transition-shadow`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{getItemTitle()}</h3>
          <p className="text-sm text-gray-600">{getItemSubtitle()}</p>
          {item.college && <p className="text-xs text-gray-500">{item.college}</p>}
          {isArchived && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <IconArchive className="w-3 h-3 mr-1" />
                Archived
              </span>
              {item.archivedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Archived on: {new Date(item.archivedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isArchived ? (
            <button
              onClick={() => onUnarchive(type, item._id)}
              className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
            >
              <IconArchiveOff className="w-4 h-4 mr-1" />
              Unarchive
            </button>
          ) : (
            <button
              onClick={() => onArchive(type, item._id)}
              className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
            >
              <IconArchive className="w-4 h-4 mr-1" />
              Archive
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
