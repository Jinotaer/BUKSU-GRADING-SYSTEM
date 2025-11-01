import React from "react";
import adminProfileImage from "../../../../assets/adminprofile.png";

export function ProfileCard({ profile, getStatusColor }) {
  return (
    <div className="lg:col-span-1">
      <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm h-full">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-30 h-30 rounded-full bg-buksu-primary flex items-center justify-center overflow-hidden">
            <img
              src={adminProfileImage}
              alt="Admin Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold font-outfit text-gray-800">
              {profile?.fullName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{profile?.email}</p>
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-3 ${
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
        </div>
      </div>
    </div>
  );
}
