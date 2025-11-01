import React from "react";
import {
  IconX,
  IconEdit,
  IconTrash,
  IconChalkboard,
  IconBook,
  IconClock,
  IconMapPin,
  IconNotes,
} from "@tabler/icons-react";

const eventTypeColors = {
  quiz: { bg: "bg-red-100", text: "text-red-800" },
  laboratory: { bg: "bg-yellow-100", text: "text-yellow-800" },
  exam: { bg: "bg-blue-100", text: "text-blue-800" },
  assignment: { bg: "bg-orange-100", text: "text-orange-800" },
  project: { bg: "bg-green-100", text: "text-green-800" },
  other: { bg: "bg-gray-100", text: "text-gray-800" },
};

const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export function ScheduleDetailModal({
  isOpen,
  schedule,
  onClose,
  onEdit,
  onDelete,
}) {
  if (!isOpen || !schedule) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {schedule.title}
              </h2>
              <span
                className={`inline-block px-2 py-1 text-xs font-semibold rounded mt-2 ${
                  eventTypeColors[schedule.eventType].bg
                } ${eventTypeColors[schedule.eventType].text}`}
              >
                {schedule.eventType.toUpperCase()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <IconX className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <IconChalkboard className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Section</p>
                <p className="font-medium">{schedule.section?.sectionName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <IconBook className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-medium">
                  {schedule.subject?.subjectCode} -{" "}
                  {schedule.subject?.subjectName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <IconClock className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Schedule</p>
                <p className="font-medium">
                  {formatDateTime(schedule.startDateTime)} -{" "}
                  {formatTime(schedule.endDateTime)}
                </p>
              </div>
            </div>

            {schedule.location && (
              <div className="flex items-start gap-3">
                <IconMapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{schedule.location}</p>
                </div>
              </div>
            )}

            {schedule.description && (
              <div className="flex items-start gap-3">
                <IconNotes className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="font-medium">{schedule.description}</p>
                </div>
              </div>
            )}

            {schedule.isGoogleCalendarSynced && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  ✓ Synced with Google Calendar
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6">
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <IconEdit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => onDelete(schedule._id)}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <IconTrash className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
