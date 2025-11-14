import React from "react";
import { IconEyeOff, IconAlertCircle } from "@tabler/icons-react";

export const HideModal = ({
  isOpen,
  section,
  hiding,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <IconEyeOff className="text-gray-600" size={24} />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Hide Subject
          </h3>
          
          <p className="text-gray-600 mb-4">
            Are you sure you want to hide this subject?
          </p>
          
          {section && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-900">
                {section.subject?.subjectName || "Subject"}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {section.subject?.subjectCode} - {section.sectionName}
              </p>
            </div>
          )}
          
          <div className="mb-6 flex items-start gap-2 text-sm text-gray-600 text-left bg-blue-50 p-3 rounded-lg">
            <IconAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
            <p>
              You can unhide it later from the Hidden Subjects page.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={hiding}
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={hiding}
              onClick={onConfirm}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {hiding ? "Hiding..." : "Hide"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
