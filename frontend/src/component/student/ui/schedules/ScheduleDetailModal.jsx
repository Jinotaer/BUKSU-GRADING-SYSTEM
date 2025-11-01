import React from "react";
import {
  IconX,
  IconClock,
  IconMapPin,
  IconNotes,
  IconChalkboard,
  IconBook,
  IconUser,
} from "@tabler/icons-react";
import { eventTypeColors, formatDateTime, formatTime } from "./scheduleConstants";

export const ScheduleDetailModal = ({ isOpen, schedule, onClose }) => {
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

            {schedule.instructor && (
              <div className="flex items-start gap-3">
                <IconUser className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Instructor</p>
                  <p className="font-medium">
                    {schedule.instructor.fullName ||
                      `${schedule.instructor.firstName || ""} ${
                        schedule.instructor.lastName || ""
                      }`.trim() ||
                      "Not assigned"}
                  </p>
                </div>
              </div>
            )}

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

            <div className="flex items-start gap-3">
              <IconMapPin className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="w-full">
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">
                  {schedule.location || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <IconNotes className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="w-full">
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium text-gray-700 whitespace-pre-wrap">
                  {schedule.description || "No description provided"}
                </p>
              </div>
            </div>

            {schedule.notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <p className="text-sm font-medium text-blue-900 mb-1 flex items-center gap-1">
                  <IconNotes className="w-4 h-4" />
                  Important Notes
                </p>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">
                  {schedule.notes}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
