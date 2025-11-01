import React from "react";
import {
  IconUsers,
  IconListDetails,
  IconClipboardList,
  IconUsersGroup,
  IconCalendarEvent,
  IconCalendarWeek,
  IconArchive,
} from "@tabler/icons-react";
import { QuickActionCard } from "./QuickActionCard";

export function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickActionCard
          icon={IconUsers}
          title="My Sections"
          description="View and manage your class sections"
          action={() => (window.location.href = "/instructor/my-sections")}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <QuickActionCard
          icon={IconListDetails}
          title="Activity Management"
          description="Create and manage student activities"
          action={() => (window.location.href = "/instructor/activity-management")}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <QuickActionCard
          icon={IconClipboardList}
          title="Manage Grades"
          description="Input and update student grades"
          action={() => (window.location.href = "/instructor/grades")}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <QuickActionCard
          icon={IconUsersGroup}
          title="Students"
          description="View and manage student enrollments"
          action={() => (window.location.href = "/instructor/students")}
          color="text-indigo-600"
          bgColor="bg-indigo-100"
        />
        <QuickActionCard
          icon={IconCalendarEvent}
          title="Semester View"
          description="View sections across semesters"
          action={() => (window.location.href = "/instructor/semester-view")}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <QuickActionCard
          icon={IconCalendarWeek}
          title="Set Schedule"
          description="Create and manage class schedules"
          action={() => (window.location.href = "/instructor/schedule")}
          color="text-teal-600"
          bgColor="bg-teal-100"
        />
        <QuickActionCard
          icon={IconArchive}
          title="Archived Management"
          description="Access archived sections and data"
          action={() => (window.location.href = "/instructor/archive")}
          color="text-gray-600"
          bgColor="bg-gray-100"
        />
      </div>
    </div>
  );
}
