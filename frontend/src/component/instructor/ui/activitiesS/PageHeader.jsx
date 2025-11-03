import React from "react";
import { IconChevronLeft, IconUpload } from "@tabler/icons-react";

export function PageHeader({ activity, section, onBack, onUploadAll, isUploadingAll }) {
  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="mt-9 inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <IconChevronLeft size={18} /> Back
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {activity ? `${activity.title} — Max ${activity.maxScore}` : "Activity Scores"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{section?.sectionName}</p>
        </div>
        
        <button
          onClick={onUploadAll}
          disabled={isUploadingAll}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 cursor-pointer transition-colors"
        >
          <IconUpload size={18} />
          {isUploadingAll ? "Uploading..." : "Upload All Scores"}
        </button>
      </div>
    </>
  );
}
