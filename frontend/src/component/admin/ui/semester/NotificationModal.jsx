import React from "react";
import { IconCircleCheck, IconX, IconAlertTriangle } from "@tabler/icons-react";

export function NotificationModal({ isOpen, onClose, type, title, message }) {
  if (!isOpen) return null;
  const isSuccess = type === "success";
  const isWarning = type === "warning";
  const iconColor = isSuccess
    ? "text-green-500"
    : isWarning
    ? "text-amber-500"
    : "text-red-500";
  const bgColor = isSuccess
    ? "bg-green-50"
    : isWarning
    ? "bg-amber-50"
    : "bg-red-50";
  const buttonColor = isSuccess
    ? "bg-blue-600 hover:bg-blue-700"
    : isWarning
    ? "bg-amber-600 hover:bg-amber-700"
    : "bg-red-600 hover:bg-red-700";
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <div
            className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${bgColor} mb-4`}
          >
            {isSuccess ? (
              <IconCircleCheck className={iconColor} size={24} />
            ) : isWarning ? (
              <IconAlertTriangle className={iconColor} size={24} />
            ) : (
              <IconX className={iconColor} size={24} />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
          <div className="text-gray-600 mb-6">{message}</div>
          <button
            onClick={onClose}
            className={`w-full text-white px-4 py-2 rounded-lg transition-colors ${buttonColor}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
