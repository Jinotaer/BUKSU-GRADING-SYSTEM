import React from "react";
import {
  IconUsers,
  IconSchool,
  IconCalendar,
  IconBook,
  IconChalkboard,
} from "@tabler/icons-react";

const tabs = [
  { id: "students", label: "Students", icon: IconUsers },
  { id: "instructors", label: "Instructors", icon: IconSchool },
  { id: "semesters", label: "Semesters", icon: IconCalendar },
  { id: "subjects", label: "Subjects", icon: IconBook },
  { id: "sections", label: "Sections", icon: IconChalkboard },
];

export function TabNavigation({ activeTab, onTabChange }) {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
