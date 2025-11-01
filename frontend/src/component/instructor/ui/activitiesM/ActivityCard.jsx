import React from "react";
import {
  IconListDetails,
  IconCalendar,
  IconTarget,
  IconUsers,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";

export function ActivityCard({
  activity,
  getAssignedSectionNames,
  formatDate,
  onEdit,
  onDelete,
}) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <IconListDetails className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">
              {activity.title}
            </h3>
            <p className="text-gray-600 text-sm flex items-center gap-1">
              <IconCalendar size={16} className="text-gray-400" />{" "}
              Due: {formatDate(activity.dueDate)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(activity)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Activity"
          >
            <IconEdit size={16} />
          </button>
          <button
            onClick={() => onDelete(activity)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Activity"
          >
            <IconTrash size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-start gap-2">
          <IconTarget size={16} className="mt-0.5 text-gray-400" />
          <span className="text-sm text-gray-700">
            {activity.description || "No description"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <IconUsers size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600">
            Assigned to:{" "}
            {getAssignedSectionNames(activity.sectionIds || []) || "None"}
          </span>
        </div>

        <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-800">
            Activity Details:
          </p>
          <p className="text-sm text-blue-600">
            Category: {activity.category || "—"}
          </p>
          <p className="text-sm text-blue-600">
            Max Score: {activity.maxScore ?? activity.points ?? 0}
          </p>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Created: {formatDate(activity.createdAt)}
      </div>
    </div>
  );
}
