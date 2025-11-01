import React from "react";
import { IconChevronLeft } from "@tabler/icons-react";

export function ActivityHeader({ title, subtitle, onBack }) {
  return (
    <div className="mb-8 mt-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200 font-medium"
      >
        <IconChevronLeft size={18} /> Back
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] mb-1">{title}</h1>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}
