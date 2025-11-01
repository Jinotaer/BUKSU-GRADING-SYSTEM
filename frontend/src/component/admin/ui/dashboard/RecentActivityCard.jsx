import React from "react";

export function RecentActivityCard({ title, activities, emptyMessage }) {
  return (
    <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <h4 className="font-outfit text-gray-800 font-semibold mb-4">
        {title}
      </h4>
      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {activity.fullName}
                </p>
                <p className="text-xs text-gray-500">{activity.email}</p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activity.status === "Active"
                    ? "bg-green-100 text-green-800"
                    : activity.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {activity.status}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}
