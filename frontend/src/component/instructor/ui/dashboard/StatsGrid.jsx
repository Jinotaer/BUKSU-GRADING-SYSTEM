import React from "react";
import {
  IconUsers,
  IconBook,
  IconChalkboard,
  IconCalendarWeek,
} from "@tabler/icons-react";
import { StatCard } from "./StatCard";

export function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        icon={IconChalkboard}
        title="Active Sections"
        value={stats.totalSections}
        color="text-blue-600"
        bgColor="bg-blue-100"
      />
      <StatCard
        icon={IconUsers}
        title="Total Students"
        value={stats.totalStudents}
        color="text-green-600"
        bgColor="bg-green-100"
      />
      <StatCard
        icon={IconBook}
        title="Subjects Teaching"
        value={stats.totalSubjects}
        color="text-purple-600"
        bgColor="bg-purple-100"
      />
      <StatCard
        icon={IconCalendarWeek}
        title="Upcoming Schedules"
        value={stats.totalSchedules}
        color="text-orange-600"
        bgColor="bg-orange-100"
      />
    </div>
  );
}
