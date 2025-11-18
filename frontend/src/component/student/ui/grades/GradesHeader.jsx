import React, { useState } from "react";
import { IconInfoCircle } from "@tabler/icons-react";
import GradeInfoModal from "../../../common/GradeInfoModal";

export const GradesHeader = () => {
  const [showGradeInfo, setShowGradeInfo] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="pt-10 text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-6 sm:mb-8 font-outfit max-[880px]:mt-10">
          My Grades
        </h1>
        <button
          onClick={() => setShowGradeInfo(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          title="View grading system information"
        >
          <IconInfoCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Grading Info</span>
        </button>
      </div>

      <GradeInfoModal 
        isOpen={showGradeInfo} 
        onClose={() => setShowGradeInfo(false)} 
      />
    </>
  );
};
