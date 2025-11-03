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
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isUploadingAll, setIsUploadingAll] = useState(false);

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

  const uploadAllScores = async () => {
    // Filter rows that have scores entered (not empty string)
    const rowsWithScores = rows.filter((row) => row.score !== "");
    const rowsWithoutScores = rows.filter((row) => row.score === "");
    
    if (rowsWithScores.length === 0) {
      setError("No scores to upload. Please enter scores before uploading.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setIsUploadingAll(true);
    
    // Prepare all scores for batch upload
    const scoresToUpload = rowsWithScores.map((row) => {
      const rowMax = Number(row.maxScore ?? max) || max;
      const numeric = Number(row.score);
      const boundedScore = Math.max(0, Math.min(rowMax, Number.isNaN(numeric) ? 0 : numeric));
      return { studentId: row.studentId, score: boundedScore };
    });

    // Mark all as saving
    const savingStatus = {};
    scoresToUpload.forEach((item) => {
      savingStatus[item.studentId] = { state: "saving" };
    });
    setRowStatus(savingStatus);

    try {
      const payload = { sectionId, rows: scoresToUpload, notify: true };
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

      // Update rows with bounded scores
      setRows((prev) =>
        prev.map((item) => {
          const uploaded = scoresToUpload.find((s) => s.studentId === item.studentId);
          return uploaded ? { ...item, score: uploaded.score } : item;
        })
      );

      // Mark all as success
      const successStatus = {};
      scoresToUpload.forEach((item) => {
        successStatus[item.studentId] = { state: "success" };
      });
      setRowStatus(successStatus);

      // Show success message with email notification info
      let message = `Successfully uploaded ${rowsWithScores.length} score(s).`;
      if (rowsWithoutScores.length > 0) {
        message += ` ${rowsWithoutScores.length} student(s) with no scores have been notified via email.`;
      } else {
        message += ` All students have been notified via email.`;
      }
      
      setError(""); // Clear any previous errors
      setSuccessMessage(message);

      // Clear status and success message after delay
      setTimeout(() => {
        setRowStatus({});
        setSuccessMessage("");
      }, 4000);
    } catch (e) {
      // Mark all as error
      const errorStatus = {};
      scoresToUpload.forEach((item) => {
        errorStatus[item.studentId] = { state: "error", message: e.message };
      });
      setRowStatus(errorStatus);
      setError(e.message || "Failed to upload scores");
    } finally {
      setIsUploadingAll(false);
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
          onUploadAll={uploadAllScores}
          isUploadingAll={isUploadingAll}
        />

        <ErrorMessage error={error} />
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

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
