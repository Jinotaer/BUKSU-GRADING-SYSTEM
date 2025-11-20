import React from "react";
import { IconEyeOff, IconFilter } from "@tabler/icons-react";

export const HiddenStats = ({
  totalHidden,
  filteredCount,
  currentPage,
  totalPages,
}) => {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <IconEyeOff className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Total Hidden</p>
              <p className="text-xl font-bold text-gray-900">{totalHidden}</p>
            </div>
          </div>

          {filteredCount < totalHidden && (
            <div className="flex items-center gap-2">
              <IconFilter className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Filtered Results</p>
                <p className="text-xl font-bold text-blue-600">
                  {filteredCount}
                </p>
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>
    </div>
  );
};
