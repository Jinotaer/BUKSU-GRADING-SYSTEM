import React from "react";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";

const EXPORT_STEPS = [
  "Preparing data...",
  "Creating spreadsheet...",
  "Writing grades...",
  "Applying formatting...",
  "Finalizing...",
];

export function ExportProgressOverlay({ currentStep, error }) {
  if (currentStep === null || currentStep === undefined) return null;

  const progressPercent = Math.min(
    ((currentStep + 1) / EXPORT_STEPS.length) * 100,
    100,
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Exporting to Google Sheets
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          Please wait while your grades are being exported...
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-5">
          <div
            className="bg-green-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {EXPORT_STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;

            return (
              <div key={index} className="flex items-center gap-3">
                {isCompleted ? (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <IconCheck className="w-3.5 h-3.5 text-green-600" />
                  </div>
                ) : isActive ? (
                  <IconLoader2 className="flex-shrink-0 w-5 h-5 text-green-600 animate-spin" />
                ) : (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200" />
                )}
                <span
                  className={`text-sm ${
                    isCompleted
                      ? "text-gray-400 line-through"
                      : isActive
                        ? "text-gray-900 font-medium"
                        : "text-gray-400"
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export { EXPORT_STEPS };
