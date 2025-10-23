import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { authenticatedFetch } from "../../utils/auth";
import { InstructorSidebar } from "./instructorSidebar";
import { IconChevronLeft } from "@tabler/icons-react";

export default function ActivityScores() {
  const { sectionId, activityId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  // Prefill (fast paint when navigating from Activities page)
  const [activity, setActivity] = useState(state?.activity || null);
  const [section, setSection] = useState(state?.section || null);

  const [rows, setRows] = useState([]);           // [{ studentId, fullName, studid, score, maxScore }]
  const [rowStatus, setRowStatus] = useState({}); // { [studentId]: { state: "saving"|"success"|"error", message? } }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const max = activity?.maxScore ?? 100;

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await authenticatedFetch(
          `http://localhost:5000/api/instructor/activities/${activityId}/scores?sectionId=${sectionId}`,
          { signal: controller.signal }
        );
        let data = {};
        try { data = await res.json(); } catch { data = {}; }
        if (!res.ok) throw new Error(data?.message || `Failed to load scores (HTTP ${res.status})`);

        setActivity(data.activity);
        setSection(data.section);

        const fetched = (Array.isArray(data.rows) ? data.rows : [])
          .map((row) => ({
            studentId: row.studentId,
            fullName: row.fullName,
            studid: row.studid,
            score: row.score ?? "",
            maxScore: row.maxScore ?? data.activity?.maxScore ?? 100,
          }))
          .sort((a, b) => {
            const n = (a.fullName || "").localeCompare(b.fullName || "", undefined, { sensitivity: "base" });
            if (n !== 0) return n;
            return (a.studid || "").localeCompare(b.studid || "", undefined, { sensitivity: "base", numeric: true });
          });

        setRows(fetched);
        setRowStatus({});
        setError("");
      } catch (e) {
        if (e?.name !== "AbortError") {
          console.error(e);
          setError(e.message || "Failed to load scores");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [activityId, sectionId]);

  // Helpers
  const setAllZero = () => setRows((prev) => prev.map((r) => ({ ...r, score: 0 })));
  const clearAll = () => setRows((prev) => prev.map((r) => ({ ...r, score: "" })));

  const setScore = useCallback(
    (id, val) => {
      setRows((prev) =>
        prev.map((row) => {
          if (row.studentId !== id) return row;
          if (val === "") return { ...row, score: "" };
          const parsed = Number(val);
          if (Number.isNaN(parsed)) return row;
          const rowMax = Number(row.maxScore ?? max) || max;
          return { ...row, score: Math.max(0, Math.min(rowMax, parsed)) };
        })
      );
    },
    [max]
  );

  const uploadScore = async (studentId) => {
    const row = rows.find((r) => r.studentId === studentId);
    if (!row) return;

    const rowMax = Number(row.maxScore ?? max) || max;
    const numeric = row.score === "" ? 0 : Number(row.score);
    const boundedScore = Math.max(0, Math.min(rowMax, Number.isNaN(numeric) ? 0 : numeric));

    setRowStatus((prev) => ({ ...prev, [studentId]: { state: "saving" } }));
    try {
      const payload = { sectionId, rows: [{ studentId, score: boundedScore }] };
      const res = await authenticatedFetch(
        `http://localhost:5000/api/instructor/activities/${activityId}/scores`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      let data = {};
      try { data = await res.json(); } catch { data = {}; }
      if (!res.ok) throw new Error(data?.message || `Upload failed (HTTP ${res.status})`);

      setRows((prev) =>
        prev.map((item) => (item.studentId === studentId ? { ...item, score: boundedScore } : item))
      );

      setRowStatus((prev) => ({ ...prev, [studentId]: { state: "success" } }));
      setTimeout(() => {
        setRowStatus((prev) => {
          const next = { ...prev };
          delete next[studentId];
          return next;
        });
      }, 1500);
    } catch (e) {
      setRowStatus((prev) => ({ ...prev, [studentId]: { state: "error", message: e.message } }));
    }
  };

  const tableRows = useMemo(() => rows, [rows]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />

      {/* match My Sections offsets for the sidebar */}
      <div className="flex-1 max-w-7xl mx-auto mt-10 px-4 sm:px-6 lg:px-8 lg:ml-64 2xl:ml-72">
        {/* Top bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
          >
            <IconChevronLeft size={18} /> Back
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={setAllZero}
              className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-100"
            >
              Set all 0
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-100"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {activity ? `${activity.title} — Max ${activity.maxScore}` : "Activity Scores"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{section?.sectionName}</p>

        {/* Error */}
        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <>
            {/* TABLE: only on lg+ (≥1024px) */}
            <div className="mt-6 hidden lg:block">
              <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr className="text-left text-gray-600">
                      <th className="px-5 py-3 font-semibold">ID</th>
                      <th className="px-5 py-3 font-semibold">NAME</th>
                      <th className="px-5 py-3 font-semibold">SCORE</th>
                      {/* hide on lg, show at xl to prevent squish */}
                      <th className="px-5 py-3 font-semibold hidden xl:table-cell">PROGRESS</th>
                      <th className="px-5 py-3 font-semibold hidden xl:table-cell">RECORDED</th>
                      <th className="px-5 py-3 font-semibold text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((r, idx) => {
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
                              onChange={(e) => setScore(r.studentId, e.target.value)}
                              className="w-24 xl:w-28 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>

                          {/* PROGRESS — lg hides, xl shows */}
                          <td className="px-5 py-3 hidden xl:table-cell">
                            <div className="w-40 bg-gray-200 rounded-full h-2.5">
                              <div
                                className="h-2.5 rounded-full bg-blue-600 transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </td>

                          {/* RECORDED — lg hides, xl shows */}
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
                                onClick={() => uploadScore(r.studentId)}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md
                                           bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                title="Upload"
                              >
                                {isSaving ? "Uploading..." : "Upload"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {tableRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                          No students in this section.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CARDS: mobile & tablet (up to lg) */}
            <div className="mt-6 space-y-3 lg:hidden">
              {tableRows.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                  No students in this section.
                </div>
              ) : (
                tableRows.map((r) => {
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
                          onClick={() => uploadScore(r.studentId)}
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
                            onChange={(e) => setScore(r.studentId, e.target.value)}
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
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
