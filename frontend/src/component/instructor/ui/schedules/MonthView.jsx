import React from "react";

const eventTypeColors = {
  quiz: { bg: "bg-red-100", text: "text-red-800" },
  laboratory: { bg: "bg-yellow-100", text: "text-yellow-800" },
  exam: { bg: "bg-blue-100", text: "text-blue-800" },
  assignment: { bg: "bg-orange-100", text: "text-orange-800" },
  project: { bg: "bg-green-100", text: "text-green-800" },
  other: { bg: "bg-gray-100", text: "text-gray-800" },
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export function MonthView({
  calendarDays,
  getSchedulesForDay,
  isToday,
  onScheduleClick,
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-7 bg-gray-50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="py-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const daySchedules = day ? getSchedulesForDay(day) : [];
          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 border-b border-r border-gray-200 ${
                !day
                  ? "bg-gray-50"
                  : isToday(day)
                  ? "bg-blue-50"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              {day && (
                <>
                  <div
                    className={`text-sm font-semibold mb-1 ${
                      isToday(day) ? "text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {day}
                  </div>
                  <div className="space-y-1">
                    {daySchedules.slice(0, 3).map((schedule) => (
                      <button
                        key={schedule._id}
                        onClick={() => onScheduleClick(schedule)}
                        className={`w-full text-left px-2 py-1 rounded text-xs ${
                          eventTypeColors[schedule.eventType].bg
                        } ${
                          eventTypeColors[schedule.eventType].text
                        } hover:opacity-80 transition-opacity`}
                      >
                        <div className="font-medium truncate">
                          {schedule.title}
                        </div>
                        <div className="truncate">
                          {formatTime(schedule.startDateTime)}
                        </div>
                      </button>
                    ))}
                    {daySchedules.length > 3 && (
                      <div className="text-xs text-gray-500 pl-2">
                        +{daySchedules.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
