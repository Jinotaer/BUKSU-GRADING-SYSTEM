import React from "react";
import {
  IconSchool,
  IconUser,
  IconCalendar,
  IconUsers,
} from "@tabler/icons-react";

export function SectionInfo({
  sectionDetails,
  invitedStudents,
  getSubjectName,
  getInstructorName,
}) {
  return (
    <div className="mb-10 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex items-center gap-3">
        <IconSchool size={24} className="text-blue-600" />
        <span className="text-base">
          <strong>Subject:</strong> {getSubjectName()}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <IconUser size={24} className="text-blue-600" />
        <span className="text-base">
          <strong>Instructor:</strong> {getInstructorName()}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <IconCalendar size={24} className="text-blue-600" />
        <span className="text-base">
          <strong>Semester:</strong> {sectionDetails.schoolYear} -{" "}
          {sectionDetails.term}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <IconUsers size={24} className="text-blue-600" />
        <span className="text-base">
          <strong>Total:</strong> {invitedStudents.length} students
        </span>
      </div>
    </div>
  );
}
