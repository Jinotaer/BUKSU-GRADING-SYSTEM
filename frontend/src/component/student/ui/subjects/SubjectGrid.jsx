import React from "react";
import { SubjectCard } from "./SubjectCard";
import { EmptySubjectState } from "./EmptySubjectState";

export const SubjectGrid = ({
  filteredClasses,
  sections,
  loading,
  onSubjectClick,
  onHideClick,
  onRefresh,
}) => {
  if (filteredClasses.length === 0 && !loading) {
    return (
      <EmptySubjectState
        hasNoSections={sections.length === 0}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredClasses.map((section) => (
        <SubjectCard
          key={section._id}
          section={section}
          onSubjectClick={onSubjectClick}
          onHideClick={onHideClick}
        />
      ))}
    </div>
  );
};
