import React from "react";
import { IconArchive } from "@tabler/icons-react";

export const ArchiveHeader = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        {/* <IconArchive className="w-8 h-8 text-gray-600" /> */}
        <h1 className="font-outfit text-[#1E3A5F] text-2xl sm:text-3xl lg:text-3xl font-bold">
          Archived Subjects
        </h1>
      </div>
      <p className="text-gray-600">
        View your past subjects that have been archived by your instructors.
      </p>
    </div>
  );
};
