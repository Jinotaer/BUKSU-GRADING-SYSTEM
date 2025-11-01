import React from "react";
import { IconBook, IconUsers, IconSchool } from "@tabler/icons-react";

export function SemesterStats({ sections }) {
  const totalStudents = sections.reduce(
    (total, section) => total + (section.students?.length || 0),
    0
  );
  const uniqueSubjects = new Set(
    sections.map((section) => section.subject?._id)
  ).size;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <IconBook className="text-blue-600" size={20} />
          <span className="text-sm font-medium text-blue-800">Sections</span>
        </div>
        <div className="text-2xl font-bold text-blue-900">{sections.length}</div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <IconUsers className="text-green-600" size={20} />
          <span className="text-sm font-medium text-green-800">Students</span>
        </div>
        <div className="text-2xl font-bold text-green-900">{totalStudents}</div>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <IconSchool className="text-purple-600" size={20} />
          <span className="text-sm font-medium text-purple-800">Subjects</span>
        </div>
        <div className="text-2xl font-bold text-purple-900">
          {uniqueSubjects}
        </div>
      </div>
    </div>
  );
}
