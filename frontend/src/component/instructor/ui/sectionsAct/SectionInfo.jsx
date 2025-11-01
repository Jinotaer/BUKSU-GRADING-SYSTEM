import React from "react";

export function SectionInfo({ section }) {
  return (
    <>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
        {section
          ? `${section?.subject?.subjectCode || ""} ${
              section?.subject?.subjectName || ""
            } — ${section?.sectionName || ""}`
          : "Activities"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage activities by category.
      </p>
    </>
  );
}
