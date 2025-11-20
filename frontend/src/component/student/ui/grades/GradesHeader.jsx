import React, { useState } from "react";
import { IconInfoCircle } from "@tabler/icons-react";
import GradeInfoModal from "../../../common/GradeInfoModal";

export const GradesHeader = () => {
  const [showGradeInfo, setShowGradeInfo] = useState(false);

  return (
    <>
      <div className="flex items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="pt-10 text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-6 sm:mb-2 font-outfit max-[880px]:mt-10">
              My Grades
            </h1>
            <button
              onClick={() => setShowGradeInfo(true)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors mt-10 mb-4 sm:mb-6"
              title="View grading system information"
            >
              <IconInfoCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Grading Info</span>
            </button>
          </div>
          <p className="text-gray-600 mt-1 mb-5 text-xs sm:text-sm md:text-base">Manage your grades and view your academic performance.</p>
        </div>
      </div>
     

      <GradeInfoModal
        isOpen={showGradeInfo}
        onClose={() => setShowGradeInfo(false)}
      />
    </>
  );
};
