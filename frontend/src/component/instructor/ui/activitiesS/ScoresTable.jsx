import React from "react";

export function ScoresTable({ 
  rows, 
  max, 
  rowStatus, 
  onScoreChange, 
  onUpload 
}) {
  if (rows.length === 0) {
    return (
      <div className="mt-6 hidden lg:block">
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-left text-gray-600">
                <th className="px-5 py-3 font-semibold">ID</th>
                <th className="px-5 py-3 font-semibold">NAME</th>
                <th className="px-5 py-3 font-semibold">SCORE</th>
                <th className="px-5 py-3 font-semibold hidden xl:table-cell">PERCENTAGE</th>
                <th className="px-5 py-3 font-semibold hidden xl:table-cell">RECORDED</th>
                <th className="px-5 py-3 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                  No students in this section.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 hidden lg:block">
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="text-left text-gray-600">
              <th className="px-5 py-3 font-semibold">ID</th>
              <th className="px-5 py-3 font-semibold">NAME</th>
              <th className="px-5 py-3 font-semibold">SCORE</th>
              <th className="px-5 py-3 font-semibold hidden xl:table-cell">PERCENTAGE</th>
              <th className="px-5 py-3 font-semibold hidden xl:table-cell">RECORDED</th>
              <th className="px-5 py-3 font-semibold text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
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
                <tr key={r.studentId} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                  <td className="px-5 py-3 text-gray-800">{r.studid}</td>
                  <td className="px-5 py-3 text-gray-900 font-medium">{r.fullName}</td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      min={0}
                      max={rowMax}
                      value={r.score}
                      onChange={(e) => onScoreChange(r.studentId, e.target.value)}
                      className="w-24 xl:w-28 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>

                  <td className="px-5 py-3 hidden xl:table-cell">
                    <div className="w-40 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-blue-600 transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-3 text-gray-800 hidden xl:table-cell">
                    {hasValue ? `${safeScore}/${rowMax}` : "--"}
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {statusText && (
                        <span
                          className={`text-xs ${
                            status?.state === "error"
                              ? "text-red-600"
                              : status?.state === "success"
                              ? "text-green-600"
                              : "text-gray-500"
                          }`}
                        >
                          {statusText}
                        </span>
                      )}
                      <button
                        onClick={() => onUpload(r.studentId)}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md
                                   bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Upload"
                      >
                        {isSaving ? "Uploading..." : "Upload"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
