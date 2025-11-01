import React from "react";
import { IconClock, IconMapPin } from "@tabler/icons-react";

const eventTypeColors = {
  quiz: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  laboratory: { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  exam: { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  assignment: { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" },
  project: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
  other: { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" },
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export function ListView({ schedules, onScheduleClick }) {
  const sortedSchedules = [...schedules].sort(
    (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="divide-y divide-gray-200">
        {sortedSchedules.length > 0 ? (
          sortedSchedules.map((schedule) => (
            <div
              key={schedule._id}
              onClick={() => onScheduleClick(schedule)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-1 h-16 rounded ${
                    eventTypeColors[schedule.eventType].dot
                  }`}
                ></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {schedule.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {schedule.subject.subjectCode} -{" "}
                        {schedule.section.sectionName}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        eventTypeColors[schedule.eventType].bg
                      } ${eventTypeColors[schedule.eventType].text}`}
                    >
                      {schedule.eventType.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <IconClock className="w-4 h-4" />
                      {formatDate(schedule.startDateTime)} at{" "}
                      {formatTime(schedule.startDateTime)}
                    </div>
                    {schedule.location && (
                      <div className="flex items-center gap-1">
                        <IconMapPin className="w-4 h-4" />
                        {schedule.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            No schedules for this month
          </div>
        )}
      </div>
    </div>
  );
}
