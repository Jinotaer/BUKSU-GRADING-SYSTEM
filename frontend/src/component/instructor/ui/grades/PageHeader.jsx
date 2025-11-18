import React, { useState } from "react";
import { IconRefresh, IconBrandGoogle, IconInfoCircle } from "@tabler/icons-react";
import GradeInfoModal from "../../../common/GradeInfoModal";

export function PageHeader({ onRefresh, onExport, onExportFinalGrade, loading, disabled }) {
  const [showGradeInfo, setShowGradeInfo] = useState(false);

  return (
    <>
      <div className="hidden lg:block">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h2 className="pt-4 sm:pt-6 md:pt-4 lg:pt-6 font-outfit text-[#1E3A5F] text-xl sm:text-2xl lg:text-3xl font-bold">
                Grade Management
              </h2>
              <button
                onClick={() => setShowGradeInfo(true)}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                title="View grading system information"
              >
                <IconInfoCircle className="h-4 w-4" />
                Grading Info
              </button>
            </div>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              Manage student grades and generate reports
            </p>
          </div>

          <div className="flex gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <IconRefresh size={18} />
            )}
            Refresh
          </button>
          <button
            onClick={onExportFinalGrade}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
            disabled={disabled}
          >
            <IconBrandGoogle size={18} />
            Export Final Grade
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
            disabled={disabled}
          >
            <IconBrandGoogle size={18} />
            Export to Google Sheets
          </button>
          </div>
        </div>
      </div>

      <GradeInfoModal 
        isOpen={showGradeInfo} 
        onClose={() => setShowGradeInfo(false)} 
      />
    </>
  );
}
