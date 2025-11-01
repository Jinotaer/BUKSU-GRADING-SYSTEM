import React from "react";

export function Notification({ show, message, type }) {
  if (!show) return null;

  return (
    <div
      className={`mb-4 p-4 rounded-lg ${
        type === "success"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {message}
    </div>
  );
}
