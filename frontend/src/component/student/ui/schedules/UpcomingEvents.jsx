import React from "react";
import { IconClock } from "@tabler/icons-react";
import { eventTypeColors, formatDate, formatTime } from "./scheduleConstants";

export const UpcomingEvents = ({ upcomingEvents, onEventClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Upcoming Events
      </h2>
      {upcomingEvents.length > 0 ? (
        <div className="space-y-3">
          {upcomingEvents.map((schedule) => (
            <div
              key={schedule._id}
              onClick={() => onEventClick(schedule)}
              className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                eventTypeColors[schedule.eventType].bg
              } ${eventTypeColors[schedule.eventType].border}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{schedule.title}</h3>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    eventTypeColors[schedule.eventType].text
                  }`}
                >
                  {schedule.eventType}
                </span>
              </div>
              <p className="text-xs text-gray-700 mb-1">
                {schedule.subject.subjectCode}
              </p>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <IconClock className="w-3 h-3" />
                {formatDate(schedule.startDateTime)}{" "}
                {formatTime(schedule.startDateTime)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No upcoming events</p>
        </div>
      )}
    </div>
  );
};
