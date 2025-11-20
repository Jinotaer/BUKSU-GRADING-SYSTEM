import React from "react";
import { IconEyeOff } from "@tabler/icons-react";

export const HiddenHeader = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-outfit text-[#1E3A5F] text-2xl sm:text-3xl lg:text-3xl font-bold">
          Hidden Subjects
        </h1>
      </div>
      <p className="text-gray-600">
        Manage subjects you have hidden from your active subjects list.
      </p>
    </div>
  );
};
