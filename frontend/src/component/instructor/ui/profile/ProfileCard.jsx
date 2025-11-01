import React from "react";
import { IconUser, IconCamera } from "@tabler/icons-react";

const getGoogleProfilePicture = (email) => {
  if (!email) return null;
  return `https://lh3.googleusercontent.com/a/default-user=s96-c?email=${encodeURIComponent(
    email
  )}`;
};

const handleImageError = (e) => {
  e.target.style.display = "none";
  e.target.nextSibling.style.display = "flex";
};

const getStatusColor = (status) => {
  switch (status) {
    case "Active":
      return "green";
    case "Inactive":
      return "red";
    default:
      return "gray";
  }
};

export function ProfileCard({ profile }) {
  return (
    <div className="lg:col-span-1">
      <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm h-full">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-blue-100">
            {/* Google Profile Picture */}
            <img
              src={getGoogleProfilePicture(profile?.email)}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
            {/* Fallback Icon */}
            <div
              className="w-full h-full bg-blue-600 flex items-center justify-center"
              style={{ display: "none" }}
            >
              <IconUser size={48} className="text-white" />
            </div>
            {/* Google Badge */}
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md">
              <IconCamera size={12} className="text-gray-500" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold font-outfit text-gray-800">
              {profile?.fullName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{profile?.email}</p>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-3 ${
                getStatusColor(profile?.status) === "green"
                  ? "bg-green-100 text-green-800"
                  : getStatusColor(profile?.status) === "red"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {profile?.status}
            </span>
          </div>
          <div className="w-full mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 text-center">
              📸 Profile picture from Google Workspace
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
