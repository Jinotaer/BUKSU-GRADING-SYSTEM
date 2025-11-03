import React from "react";
import { IconX, IconArchive } from "@tabler/icons-react";

export function ArchiveModal({
  isOpen,
  section,
  onClose,
  onConfirm,
  loading,
}) {
  if (!isOpen || !section) return null;

  return (
    <div className="fixed inset-0 bg-black/20 bg-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Archive Section
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg mb-4">
            <IconArchive className="w-8 h-8 text-orange-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{section.sectionName}</p>
              <p className="text-sm text-gray-600">
                {section.subject?.subjectCode} - {section.schoolYear}{" "}
                {section.term}
              </p>
            </div>
          </div>
          <p className="text-gray-600 mb-2">
            Are you sure you want to archive this section? It will be moved to
            your archived sections and hidden from the active list.
          </p>
          <p className="text-sm text-gray-500">
            Students enrolled: {section.students?.length || 0}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            You can restore it later from the Archive Management page.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Archiving...</span>
              </>
            ) : (
              <>
                <IconArchive size={16} />
                <span>Archive Section</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
