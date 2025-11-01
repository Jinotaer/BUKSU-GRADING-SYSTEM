import React from "react";
import { IconCheck, IconX } from "@tabler/icons-react";

export function Alert({ show, type, message, onClose }) {
  if (!show) return null;

  return (
    <div
      className={`p-4 mb-6 rounded-md border flex items-center justify-between ${
        type === "success"
          ? "bg-green-50 border-green-200 text-green-800"
          : type === "error"
          ? "bg-red-50 border-red-200 text-red-800"
          : "bg-blue-50 border-blue-200 text-blue-800"
      }`}
    >
      <div className="flex items-center gap-2">
        {type === "success" ? <IconCheck size={16} /> : <IconX size={16} />}
        <span>{message}</span>
      </div>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <IconX size={16} />
      </button>
    </div>
  );
}
