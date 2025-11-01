import React from "react";
import { IconPencil, IconTrash, IconClock } from "@tabler/icons-react";

const catBadge = (c) =>
  c === "classStanding"
    ? "bg-blue-100 text-blue-800"
    : c === "laboratory"
    ? "bg-green-100 text-green-800"
    : c === "majorOutput"
    ? "bg-purple-100 text-purple-800"
    : "bg-gray-100 text-gray-800";

const getCategoryLabel = (category) => {
  switch (category) {
    case "classStanding":
      return "Class Standing";
    case "laboratory":
      return "Laboratory";
    case "majorOutput":
      return "Major Output";
    default:
      return category;
  }
};

export function ActivityCard({ activity, onEdit, onDelete, onClick }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Make the left block clickable to open scores */}
        <button
          onClick={() => onClick(activity)}
          className="flex-1 text-left"
          title="Open scores"
        >
          <h3 className="font-semibold text-gray-900 underline-offset-2 hover:underline">
            {activity.title}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${catBadge(
                activity.category
              )}`}
            >
              {getCategoryLabel(activity.category)}
            </span>
            <span className="text-xs text-gray-500">
              Max: {activity.maxScore}
            </span>
          </div>
          {activity.description && (
            <p className="mt-2 text-sm text-gray-700">
              {activity.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <IconClock size={14} /> Created:{" "}
              {new Date(activity.createdAt).toLocaleDateString()}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(activity);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-gray-100 hover:bg-gray-200"
          >
            <IconPencil size={14} /> Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(activity._id);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700"
          >
            <IconTrash size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
