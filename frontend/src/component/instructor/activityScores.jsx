import React, { useEffect, useMemo, useCallback, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { authenticatedFetch } from "../../utils/auth";
import { InstructorSidebar } from "./instructorSidebar";
import Pagination from "../common/Pagination";
import {
  PageHeader,
  ErrorMessage,
  LoadingSpinner,
  ScoresTable,
  ScoresCards,
} from "./ui/activitiesS";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Pagination calculations
  const totalPages = Math.ceil(tableRows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = tableRows.slice(startIndex, endIndex);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <InstructorSidebar />

      <div className="flex-1 max-w-7xl mx-auto mt-10 px-4 sm:px-6 lg:px-8 lg:ml-64 2xl:ml-72">
        <PageHeader 
          activity={activity} 
          section={section} 
          onBack={() => navigate(-1)} 
        />

        <ErrorMessage error={error} />

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <ScoresTable
              rows={paginatedRows}
              max={max}
              rowStatus={rowStatus}
              onScoreChange={setScore}
              onUpload={uploadScore}
            />

            <ScoresCards
              rows={paginatedRows}
              max={max}
              rowStatus={rowStatus}
              onScoreChange={setScore}
              onUpload={uploadScore}
            />

            {tableRows.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={tableRows.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                rowsPerPageOptions={[5, 10, 15, 20, 25]}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
