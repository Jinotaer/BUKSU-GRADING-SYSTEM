import React from "react";
import {
  IconCalendarEvent,
  IconClock,
  IconMapPin,
} from "@tabler/icons-react";

export function UpcomingSchedules({ schedules }) {
  const eventTypeColors = {
    class: "bg-blue-50 border-blue-200 text-blue-600",
    exam: "bg-red-50 border-red-200 text-red-600",
    quiz: "bg-yellow-50 border-yellow-200 text-yellow-600",
    meeting: "bg-purple-50 border-purple-200 text-purple-600",
    event: "bg-green-50 border-green-200 text-green-600",
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Upcoming Schedules
      </h2>
      {schedules.length > 0 ? (
        <div className="space-y-3">
          {schedules.map((schedule) => {
            const startDate = new Date(schedule.startDateTime);
            const endDate = new Date(schedule.endDateTime);
            const colorClass =
              eventTypeColors[schedule.eventType] ||
              "bg-gray-50 border-gray-200 text-gray-600";

            return (
              <div
                key={schedule._id}
                className={`flex items-start gap-3 p-4 border rounded-lg ${colorClass}`}
              >
                <IconCalendarEvent className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {schedule.title}
                      </p>
                      <p className="text-sm text-gray-700 mt-0.5">
                        {schedule.subject?.subjectCode} -{" "}
                        {schedule.section?.sectionName}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/50">
                      {schedule.eventType.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <IconClock className="w-4 h-4" />
                      <span>
                        {startDate.toLocaleDateString()}{" "}
                        {startDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" - "}
                        {endDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {schedule.location && (
                      <div className="flex items-center gap-1">
                        <IconMapPin className="w-4 h-4" />
                        <span>{schedule.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <IconCalendarEvent className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No upcoming schedules</p>
          <button
            onClick={() => (window.location.href = "/instructor/schedule")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Schedule
          </button>
        </div>
      )}
    </div>
  );
}
