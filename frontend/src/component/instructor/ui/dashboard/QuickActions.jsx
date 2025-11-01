import React from "react";
import {
  IconChalkboard,
  IconAward,
  IconCalendarEvent,
  IconUsers,
  IconTrendingUp,
} from "@tabler/icons-react";
import { QuickActionCard } from "./QuickActionCard";

export function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Actions
      </h2>
      <div className="space-y-4">
        <QuickActionCard
          icon={IconChalkboard}
          title="Add New Section"
          description="Create a new class section for your subjects"
          action={() => (window.location.href = "/instructor/add-sections")}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <QuickActionCard
          icon={IconAward}
          title="Manage Grades"
          description="Input and update student grades"
          action={() => (window.location.href = "/instructor/grades")}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <QuickActionCard
          icon={IconCalendarEvent}
          title="Schedule Management"
          description="Create and manage class schedules"
          action={() => (window.location.href = "/instructor/schedule")}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <QuickActionCard
          icon={IconUsers}
          title="View Students"
          description="See all students in your sections"
          action={() => (window.location.href = "/instructor/students")}
          color="text-indigo-600"
          bgColor="bg-indigo-100"
        />
        <QuickActionCard
          icon={IconTrendingUp}
          title="Grade Reports"
          description="Generate and view grade reports"
          action={() => (window.location.href = "/instructor/grade-reports")}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>
    </div>
  );
}
