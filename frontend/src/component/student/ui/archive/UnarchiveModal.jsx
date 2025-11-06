import React from "react";
import { IconRestore, IconX } from "@tabler/icons-react";

export const UnarchiveModal = ({
  isOpen,
  section,
  unarchiving,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !section) return null;

  return (
    <div className="fixed inset-0 bg-black/20 bg-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <IconRestore className="w-5 h-5 mr-2 text-green-500" />
            Unarchive Subject
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={unarchiving}
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to unarchive this subject? It will appear
            back in your active subjects list.
          </p>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900">
              {section.subject?.subjectCode} -{" "}
              {section.subject?.subjectName}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Section: {section.sectionName}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={unarchiving}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={unarchiving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300 flex items-center"
          >
            <IconRestore className="w-4 h-4 mr-2" />
            {unarchiving ? "Unarchiving..." : "Unarchive"}
          </button>
        </div>
      </div>
    </div>
  );
};
