import React from "react";
import { IconClock, IconMapPin } from "@tabler/icons-react";
import { eventTypeColors, formatDate, formatTime } from "./scheduleConstants";

export const ListCalendarView = ({ monthSchedules, onEventClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="divide-y divide-gray-200">
        {monthSchedules.length > 0 ? (
          monthSchedules
            .sort(
              (a, b) =>
                new Date(a.startDateTime) - new Date(b.startDateTime)
            )
            .map((schedule) => (
              <div
                key={schedule._id}
                onClick={() => onEventClick(schedule)}
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
};
