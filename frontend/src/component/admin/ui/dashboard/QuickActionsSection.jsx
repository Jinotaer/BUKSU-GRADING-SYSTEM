import React from "react";
import {
  IconUsersGroup,
  IconUserCog,
  IconCalendar,
  IconBook,
} from "@tabler/icons-react";
import { QuickActionCard } from "./QuickActionCard";

export function QuickActionsSection() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-10">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickActionCard
          icon={IconUsersGroup}
          title="Student Management"
          description="View and manage all student accounts"
          action={() => (window.location.href = "/admin/students")}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <QuickActionCard
          icon={IconUserCog}
          title="Instructor Management"
          description="Manage instructor accounts and invitations"
          action={() => (window.location.href = "/admin/instructors")}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <QuickActionCard
          icon={IconCalendar}
          title="Add Semester"
          description="Create and manage academic semesters"
          action={() => (window.location.href = "/admin/semestral-period")}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <QuickActionCard
          icon={IconBook}
          title="Add Subjects"
          description="Create and manage course subjects"
          action={() => (window.location.href = "/admin/subjects")}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <QuickActionCard
          icon={IconBook}
          title="Add Sections"
          description="Create and manage course sections"
          action={() => (window.location.href = "/admin/subjects")}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>
    </div>
  );
}
