import React from "react";

export function ActivityList({ activities, loading, error, onEdit, onDelete, onClick }) {
  if (error) {
    return <div className="mb-3 text-sm text-red-600">{error}</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-gray-500 text-sm py-10 text-center">
        No activities found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity._id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-start justify-between gap-4">
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
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    activity.category === "classStanding"
                      ? "bg-blue-100 text-blue-800"
                      : activity.category === "laboratory"
                      ? "bg-green-100 text-green-800"
                      : activity.category === "majorOutput"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {activity.category === "classStanding"
                    ? "Class Standing"
                    : activity.category === "laboratory"
                    ? "Laboratory"
                    : "Major Output"}
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
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(activity);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-gray-100 hover:bg-gray-200"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(activity._id);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
