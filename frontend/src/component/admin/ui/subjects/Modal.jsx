import React from "react";
import { IconX } from "@tabler/icons-react";

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
      <div className="bg-white/95 backdrop-blur-md rounded-lg w-full max-w-lg mx-auto max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl border border-white/20">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md flex justify-between items-center p-4 sm:p-5 md:p-6 border-b border-gray-200 z-10">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 pr-2">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0 touch-manipulation"
            aria-label="Close modal"
          >
            <IconX size={20} className="sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5 md:p-6">{children}</div>
      </div>
    </div>
  );
}
