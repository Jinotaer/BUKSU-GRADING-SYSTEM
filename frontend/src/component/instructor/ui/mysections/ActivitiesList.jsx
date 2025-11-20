import React from "react";
import {
  IconPlus,
  IconClipboardList,
  IconCalendar,
  IconClock,
  IconTarget,
} from "@tabler/icons-react";

export function ActivitiesList({
  selectedSection,
  activities,
  loading,
  activityFilter,
  onFilterChange,
  onAddActivity,
  getSubjectName,
  getCategoryColor,
  getCategoryLabel,
}) {
  const filteredActivities = activities.filter((activity) => {
    if (activityFilter === "all") return true;
    return activity.category === activityFilter;
  });

  return (
    <div className="space-y-4">
      {selectedSection && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-blue-800 mb-2">
            Section Information:
          </h4>
          <p className="text-sm text-blue-600">
            <strong>Section:</strong> {selectedSection.sectionName}
          </p>
          <p className="text-sm text-blue-600">
            <strong>Subject:</strong> {getSubjectName(selectedSection)}
          </p>
          <p className="text-sm text-blue-600">
            <strong>Students:</strong> {selectedSection.students?.length || 0}{" "}
            enrolled
          </p>
        </div>
      )}

      {/* Filter and Add Activity Button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {[
            { key: "all", label: "All" },
            { key: "classStanding", label: "Class Standing" },
            { key: "laboratory", label: "Laboratory Activities" },
            { key: "majorOutput", label: "Major Output" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => onFilterChange(tab.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                activityFilter === tab.key
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onAddActivity}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <IconPlus size={16} />
          Add Activity
        </button>
      </div>

      {/* Activities List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredActivities.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredActivities.map((activity) => (
            <div
              key={activity._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg mb-1">
                    {activity.title}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                        activity.category
                      )}`}
                    >
                      {getCategoryLabel(activity.category)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Max Score: {activity.maxScore}
                    </span>
                  </div>
                </div>
              </div>

              {activity.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {activity.description}
                </p>
              )}

              {activity.instructions && (
                <div className="bg-gray-50 p-3 rounded-lg mb-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Instructions:
                  </p>
                  <p className="text-sm text-gray-600">
                    {activity.instructions}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  {activity.dueDate && (
                    <div className="flex items-center gap-1">
                      <IconCalendar size={14} />
                      <span>
                        Due: {new Date(activity.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <IconClock size={14} />
                    <span>
                      Created:{" "}
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <IconTarget size={14} />
                  <span>{activity.isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <IconClipboardList
            className="mx-auto text-gray-300 mb-4"
            size={48}
          />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No activities found
          </h3>
          <p className="text-gray-500 mb-4">
            {activityFilter === "all"
              ? "This section has no activities yet."
              : `No ${getCategoryLabel(
                  activityFilter
                ).toLowerCase()} activities found.`}
          </p>
          <button
            onClick={onAddActivity}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto cursor-pointer"
          >
            <IconPlus size={16} />
            Create First Activity
          </button>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={() => {}}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
