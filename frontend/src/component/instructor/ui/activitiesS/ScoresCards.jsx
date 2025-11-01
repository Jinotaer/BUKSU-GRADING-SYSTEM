import React from "react";

export function ScoresCards({ 
  rows, 
  max, 
  rowStatus, 
  onScoreChange, 
  onUpload 
}) {
  if (rows.length === 0) {
    return (
      <div className="mt-6 space-y-3 lg:hidden">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          No students in this section.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3 lg:hidden">
      {rows.map((r) => {
        const rowMax = Number(r.maxScore ?? max) || max;
        const hasValue = r.score !== "";
        const numScore = hasValue ? Number(r.score) : 0;
        const safeScore = Number.isNaN(numScore) ? 0 : numScore;
        const percent = rowMax > 0 ? Math.min(100, Math.max(0, (safeScore / rowMax) * 100)) : 0;

        const status = rowStatus[r.studentId];
        const isSaving = status?.state === "saving";
        const statusText =
          status?.state === "error"
            ? status.message || "Upload failed"
            : status?.state === "success"
            ? "Saved"
            : "";

        return (
          <div key={r.studentId} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-sm text-gray-500">ID</div>
                <div className="font-semibold text-gray-900">{r.studid}</div>
              </div>
              <button
                onClick={() => onUpload(r.studentId)}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isSaving ? "Uploading..." : "Upload"}
              </button>
            </div>

            <div className="mt-3">
              <div className="text-sm text-gray-500">Name</div>
              <div className="font-medium text-gray-900">{r.fullName}</div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-gray-500">Score</div>
                <input
                  type="number"
                  min={0}
                  max={rowMax}
                  value={r.score}
                  onChange={(e) => onScoreChange(r.studentId, e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="text-sm text-gray-500">Recorded</div>
                <div className="mt-2 text-gray-900">{hasValue ? `${safeScore}/${rowMax}` : "--"}</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-1">Progress</div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              {statusText && (
                <div
                  className={`mt-2 text-xs ${
                    status?.state === "error"
                      ? "text-red-600"
                      : status?.state === "success"
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {statusText}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
