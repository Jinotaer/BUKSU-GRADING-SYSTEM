import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  IconUsers,
  IconFilter,
  IconDownload,
  IconRefresh,
} from "@tabler/icons-react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";

/* ---------- toast refs ---------- */
function useToastRefs(notifications) {
  const errRef = useRef(notifications.showError);
  const okRef = useRef(notifications.showSuccess);
  useEffect(() => {
    errRef.current = notifications.showError;
    okRef.current = notifications.showSuccess;
  }, [notifications]);
  return { showErrorRef: errRef, showSuccessRef: okRef };
}

export default function GradeManagement() {
  /* ---------- state ---------- */
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [activities, setActivities] = useState({
    classStanding: [],
    laboratory: [],
    majorOutput: [],
  });
  const [loading, setLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState("");
  const [activeTab, setActiveTab] = useState("classStanding");

  const notifications = useNotifications();
  const { showErrorRef, showSuccessRef } = useToastRefs(notifications);

  /* ---------- helpers (non-UI) ---------- */
  const ensureLen = (arr, len) => {
    const a = Array.isArray(arr) ? arr.slice(0, len) : [];
    while (a.length < len) a.push(0);
    return a;
  };

  const fetchInstructorSections = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authenticatedFetch(
        "http://localhost:5000/api/instructor/sections"
      );
      if (!res.ok) {
        const e = await res.json();
        return showErrorRef.current(e.message || "Failed to fetch sections");
      }
      const data = await res.json();
      const list = data.sections || [];
      setSections((prevSections) => {
        // Only set initial section if no section is currently selected and we have sections
        if (prevSections.length === 0 && list.length > 0) {
          setSelectedSection(list[0]);
        }
        return list;
      });
    } catch (err) {
      showErrorRef.current("Error fetching sections");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showErrorRef]);

  const fetchActivities = useCallback(async () => {
    if (!selectedSection?._id) return null;
    try {
      const res = await authenticatedFetch(
        `http://localhost:5000/api/instructor/sections/${selectedSection._id}/activities`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const organized = {
        classStanding:
          data.activities?.filter((a) => a.category === "classStanding") || [],
        laboratory:
          data.activities?.filter((a) => a.category === "laboratory") || [],
        majorOutput:
          data.activities?.filter((a) => a.category === "majorOutput") || [],
      };
      setActivities(organized);
      return organized;
    } catch (err) {
      console.error("Error fetching activities:", err);
      return null;
    }
  }, [selectedSection?._id]);

  const fetchStudentsAndGrades = useCallback(
    async (currentActivities) => {
      if (!selectedSection?._id) return;

      try {
        setLoading(true);

        // 1) roster
        const studentsRes = await authenticatedFetch(
          `http://localhost:5000/api/instructor/sections/${selectedSection._id}/students`
        );
        if (!studentsRes.ok) {
          const e = await studentsRes.json().catch(() => ({}));
          showErrorRef.current(e.message || "Failed to fetch students");
          return;
        }
        const studentsData = await studentsRes.json();
        const roster = studentsData.students || [];

        // 2) activities
        const allActivities = [
          ...(currentActivities?.classStanding || []),
          ...(currentActivities?.laboratory || []),
          ...(currentActivities?.majorOutput || []),
        ];

        if (allActivities.length === 0) {
          // no activities yet → just set clean students
          setStudents(roster.map((s) => ({ ...s, activityScores: [] })));
          setGrades({});
          return;
        }

        // 3) fetch all activity scores in parallel; treat 404 as "no rows"
        const results = await Promise.allSettled(
          allActivities.map((a) =>
            authenticatedFetch(
              `http://localhost:5000/api/activityScores/activities/${a._id}/scores?sectionId=${selectedSection._id}`
            )
          )
        );

        // Build a map: activityId -> rows[]
        const activityRowsMap = new Map();
        let non404ErrorOnce = false;

        await Promise.all(
          results.map(async (r, idx) => {
            const activity = allActivities[idx];

            // network/error
            if (r.status !== "fulfilled") {
              if (!non404ErrorOnce) {
                showErrorRef.current("Failed to load some activity scores.");
                non404ErrorOnce = true;
              }
              activityRowsMap.set(String(activity._id), []);
              return;
            }

            const res = r.value;
            if (res.ok) {
              const data = await res.json().catch(() => ({ rows: [] }));
              activityRowsMap.set(String(activity._id), data.rows || []);
              return;
            }

            // handle 404 (no scores yet) silently
            if (res.status === 404) {
              activityRowsMap.set(String(activity._id), []);
              return;
            }

            // any other non-404 -> report once
            if (!non404ErrorOnce) {
              non404ErrorOnce = true;
              try {
                const e = await res.json();
                showErrorRef.current(
                  e?.message || "Error loading activity scores."
                );
              } catch {
                showErrorRef.current("Error loading activity scores.");
              }
            }
            activityRowsMap.set(String(activity._id), []);
          })
        );

        // 4) attach activityScores per student
        const studentsWithScores = roster.map((student) => {
          const activityScores = allActivities.map((a) => {
            const rows = activityRowsMap.get(String(a._id)) || [];
            const hit = rows.find((row) => row.studentId === student._id);
            return {
              activity_id: a._id,
              score: Number(hit?.score || 0),
              maxScore: Number(hit?.maxScore || a.maxScore || 100),
            };
          });
          return { ...student, activityScores };
        });

        setStudents(studentsWithScores);

        // 5) prepare export shells (unchanged)
        const initial = {};
        for (const s of studentsWithScores) {
          const g = s.grade || {};
          initial[s._id] = {
            classStandingScores: Array.isArray(g.classStandingScores)
              ? g.classStandingScores
              : [],
            classStandingAverage: g.classStanding || 0,
            classStandingEquivalent: g.classStandingEquivalent || 0,
            laboratoryScores: Array.isArray(g.laboratoryScores)
              ? g.laboratoryScores
              : [],
            laboratoryAverage: g.laboratory || 0,
            laboratoryEquivalent: g.laboratoryEquivalent || 0,
            majorOutputScores: Array.isArray(g.majorOutputScores)
              ? g.majorOutputScores
              : [],
            majorOutputAverage: g.majorOutput || 0,
            majorOutputEquivalent: g.majorOutputEquivalent || 0,
            midtermGrade: g.midtermGrade || 0,
            finalGrade: g.finalGrade || 0,
            remarks: g.remarks || "No Grade",
          };
        }
        setGrades(initial);
      } catch (err) {
        console.error("Error fetching students and grades:", err);
        showErrorRef.current("Error fetching students and grades");
      } finally {
        setLoading(false);
      }
    },
    [selectedSection?._id, showErrorRef]
  );

  /* ---------- effects ---------- */
  useEffect(() => {
    fetchInstructorSections();
  }, [fetchInstructorSections]);

  useEffect(() => {
    if (!selectedSection?._id) return;
    fetchActivities();
  }, [selectedSection?._id, fetchActivities]);

  useEffect(() => {
    if (
      !selectedSection?._id ||
      (!activities.classStanding.length &&
        !activities.laboratory.length &&
        !activities.majorOutput.length)
    ) {
      return;
    }
    fetchStudentsAndGrades(activities);
  }, [selectedSection?._id, activities, fetchStudentsAndGrades]);

  useEffect(() => {
    if (!students.length) return;
    const csLen = activities.classStanding.length || 3;
    const labLen = activities.laboratory.length || 3;
    const moLen = activities.majorOutput.length || 3;
    setGrades((prev) => {
      const next = { ...prev };
      for (const s of students) {
        const g = next[s._id] || {};
        next[s._id] = {
          ...g,
          classStandingScores: ensureLen(g.classStandingScores, csLen),
          laboratoryScores: ensureLen(g.laboratoryScores, labLen),
          majorOutputScores: ensureLen(g.majorOutputScores, moLen),
        };
      }
      return next;
    });
  }, [
    students,
    activities.classStanding.length,
    activities.laboratory.length,
    activities.majorOutput.length,
  ]);

  // refresh every 30s
  const refreshRef = useRef(null);
  useEffect(() => {
    if (refreshRef.current) {
      clearInterval(refreshRef.current);
      refreshRef.current = null;
    }
    if (selectedSection?._id) {
      refreshRef.current = setInterval(async () => {
        const current = await fetchActivities();
        if (current) await fetchStudentsAndGrades(current);
      }, 30000);
    }
    return () => refreshRef.current && clearInterval(refreshRef.current);
  }, [selectedSection?._id, fetchActivities, fetchStudentsAndGrades]);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      await fetchInstructorSections();
      const current = await fetchActivities();
      if (current) await fetchStudentsAndGrades(current);
      showSuccessRef.current("Data refreshed successfully!");
    } catch {
      showErrorRef.current("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  }, [
    fetchInstructorSections,
    fetchActivities,
    fetchStudentsAndGrades,
    showErrorRef,
    showSuccessRef,
  ]);

  const exportGrades = () => {
    if (!selectedSection || !students.length) return;
    const csv = [
      [
        "Student ID",
        "Student Name",
        "CS Avg",
        "LAB Avg",
        "MO Avg",
        "Midterm",
        "Final Grade",
        "Remarks",
      ].join(","),
      ...students.map((s) => {
        const g = grades[s._id] || {};
        return [
          s.studid || "",
          `"${s.fullName}"`,
          g.classStandingAverage ?? 0,
          g.laboratoryAverage ?? 0,
          g.majorOutputAverage ?? 0,
          g.midtermGrade ?? 0,
          g.finalGrade ?? 0,
          `"${g.remarks || "No Grade"}"`,
        ].join(",");
      }),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSection.sectionName}_${selectedSection.schoolYear}_${selectedSection.term}_grades.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ---------- rendering helpers ---------- */
  const tones = {
    classStanding: {
      bg: "bg-blue-50",
      line: "text-blue-600",
      cell: "bg-blue-100",
      num: "text-blue-700",
    },
    laboratory: {
      bg: "bg-green-50",
      line: "text-green-600",
      cell: "bg-green-100",
      num: "text-green-700",
    },
    majorOutput: {
      bg: "bg-purple-50",
      line: "text-purple-600",
      cell: "bg-purple-100",
      num: "text-purple-700",
    },
  };

  const eqFromPercent = (avg) => {
    if (avg >= 97) return 1.0;
    if (avg >= 94) return 1.25;
    if (avg >= 91) return 1.5;
    if (avg >= 88) return 1.75;
    if (avg >= 85) return 2.0;
    if (avg >= 82) return 2.25;
    if (avg >= 79) return 2.5;
    if (avg >= 76) return 2.75;
    if (avg >= 75) return 3.0;
    return 5.0;
  };

  const getWeight = (cat) => {
    const gs = selectedSection?.gradingSchema || {};
    return cat === "classStanding"
      ? gs.classStanding ?? 0
      : cat === "laboratory"
      ? gs.laboratory ?? 0
      : gs.majorOutput ?? 0;
  };

  const percentFor = (student, activity) => {
    const hit =
      student.activityScores?.find(
        (s) => String(s.activity_id) === String(activity._id)
      ) ||
      student.grades?.find(
        (g) => String(g.activity_id) === String(activity._id)
      );
    const score = Number(hit?.score ?? 0);
    const max = Number(hit?.maxScore ?? activity?.maxScore ?? 100);
    return max > 0 ? (score / max) * 100 : 0;
  };

  const categoryAverage = (student, cat) => {
    const acts = activities?.[cat] ?? [];
    if (!acts.length) return 0;
    const vals = acts.map((a) => percentFor(student, a));
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(filterTerm.toLowerCase()) ||
      s.studid?.toLowerCase().includes(filterTerm.toLowerCase())
  );

  const WeightBadge = ({ category }) => (
    <div className="flex-shrink-0 rounded-full px-2 sm:px-3 py-1 text-xs font-semibold bg-gray-900/80 text-white">
      {getWeight(category)}%
    </div>
  );

  // Fully responsive category table
  const CategoryTable = ({ category, title }) => {
    const tone = tones[category];
    const acts = activities?.[category] ?? [];
    const weight = getWeight(category);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className={`p-3 sm:p-4 border-b border-gray-200 ${tone.bg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">
                {title} Scores
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Weighted at <span className="font-semibold">{weight}%</span> of
                final grade
              </p>
            </div>
            <WeightBadge category={category} />
          </div>
        </div>

        {/* Desktop/Large Tablet Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr>
                <th className="border border-gray-200 px-2 py-2 text-left w-12 text-xs">
                  #
                </th>
                <th className="border border-gray-200 px-2 py-2 text-left w-24 text-xs">
                  ID
                </th>
                <th className="border border-gray-200 px-3 py-2 text-left min-w-[180px] text-xs">
                  Name
                </th>

                {acts.map((a) => (
                  <th
                    key={a._id}
                    className={`border border-gray-200 px-2 py-2 text-center w-20 ${tone.cell}`}
                  >
                    <div
                      className="font-medium truncate text-xs"
                      title={a.title}
                    >
                      {a.title.length > 8
                        ? a.title.substring(0, 8) + "..."
                        : a.title}
                    </div>
                    <div className={`text-xs ${tone.line}`}>
                      /{a.maxScore ?? 100}
                    </div>
                  </th>
                ))}

                <th
                  className={`border border-gray-200 px-2 py-2 text-center w-16 ${tone.cell} text-xs`}
                >
                  Avg
                </th>
                <th
                  className={`border border-gray-200 px-2 py-2 text-center w-16 ${tone.cell} text-xs`}
                >
                  Grade
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, i) => {
                const avg = categoryAverage(student, category);
                const eq = eqFromPercent(avg);
                return (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-2 py-4 text-center text-xs">
                      {i + 1}
                    </td>
                    <td className="border border-gray-200 px-2 py-4 text-xs truncate">
                      {student.studid}
                    </td>
                    <td className="border border-gray-200 px-2 py-4 font-medium text-xs">
                      {student.fullName}
                    </td>

                    {acts.map((a) => {
                      const raw =
                        student.activityScores?.find(
                          (s) => String(s.activity_id) === String(a._id)
                        )?.score ??
                        student.grades?.find(
                          (g) => String(g.activity_id) === String(a._id)
                        )?.score ??
                        0;
                      return (
                        <td
                          key={`${student._id}-${a._id}`}
                          className="border border-gray-200 px-2 py-4 text-center"
                        >
                          <div className={`font-semibold text-xs ${tone.num}`}>
                            {Math.round(raw)}
                          </div>
                        </td>
                      );
                    })}

                    <td
                      className={`border border-gray-200 px-1 py-4 text-center font-semibold text-xs ${tone.cell}`}
                    >
                      {avg ? `${avg.toFixed(1)}%` : "0%"}
                    </td>
                    <td
                      className={`border border-gray-200 px-1 py-4 text-center font-semibold text-xs ${tone.cell}`}
                    >
                      {eq.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Cards - responsive layout */}
        <div className="lg:hidden">
          {filteredStudents.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredStudents.map((student, i) => {
                const avg = categoryAverage(student, category);
                const eq = eqFromPercent(avg);
                return (
                  <div key={student._id} className="p-3 sm:p-4">
                    {/* Student Info Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-gray-500">
                          #{i + 1} • {student.studid}
                        </div>
                        <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {student.fullName}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-gray-500">Average</div>
                        <div className="text-sm sm:text-base font-bold text-gray-900">
                          {avg ? `${avg.toFixed(1)}%` : "0%"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Grade: {eq.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Activities Grid - responsive */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2">
                      {acts.map((a) => {
                        const raw =
                          student.activityScores?.find(
                            (s) => String(s.activity_id) === String(a._id)
                          )?.score ??
                          student.grades?.find(
                            (g) => String(g.activity_id) === String(a._id)
                          )?.score ??
                          0;
                        const max = a.maxScore ?? 100;
                        return (
                          <div
                            key={`${student._id}-${a._id}`}
                            className={`rounded-lg border p-2 sm:p-3 ${tone.cell}`}
                          >
                            <div
                              className="text-xs text-gray-600 truncate"
                              title={a.title}
                            >
                              {a.title}
                            </div>
                            <div
                              className={`text-sm font-semibold mt-1 ${tone.num}`}
                            >
                              {Math.round(raw)}/{max}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <IconUsers className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-sm">No students found</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ---------- early load ---------- */
  if (loading && !selectedSection) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar - responsive */}
        <div className="hidden lg:block">
          <InstructorSidebar />
        </div>
        <div className="flex-1 w-full lg:ml-64 p-6 sm:p-8 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- UI ---------- */
  return (
    <NotificationProvider notifications={notifications}>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar - only on large screens */}
        <div className="hidden lg:block fixed inset-y-0 left-0 z-50">
          <InstructorSidebar />
        </div>

        {/* Main content - responsive for all screen sizes */}
        <div className="lg:ml-64">
          <div className="min-h-screen">
            {/* Mobile header */}
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
              <h1 className="text-lg font-semibold text-gray-900">
                Grade Management
              </h1>
            </div>

            {/* Content area */}
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto space-y-6">
                {/* Header section - responsive */}
                <div className="hidden lg:block">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-outfit text-[#1E3A5F] text-2xl lg:text-3xl font-bold">
                        Grade Management
                      </h2>
                      <p className="text-gray-600 mt-1 text-sm md:text-base">
                        Manage student grades and generate reports
                      </p>
                    </div>

                    {/* Action Buttons - Desktop */}
                    <div className="flex gap-3">
                      <button
                        onClick={refreshData}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm font-medium"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <IconRefresh size={18} />
                        )}
                        Refresh
                      </button>
                      <button
                        onClick={exportGrades}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
                        disabled={!selectedSection || !students.length}
                      >
                        <IconDownload size={18} />
                        Export CSV
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile action buttons */}
                <div className="lg:hidden flex flex-col xs:flex-row gap-2">
                  <button
                    onClick={refreshData}
                    disabled={loading}
                    className="flex-1 xs:flex-none flex items-center justify-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <IconRefresh size={16} />
                    )}
                    <span>Refresh</span>
                  </button>
                  <button
                    onClick={exportGrades}
                    className="flex-1 xs:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
                    disabled={!selectedSection || !students.length}
                  >
                    <IconDownload size={16} />
                    <span>Export</span>
                  </button>
                </div>

                {/* Responsive Section Selector and Search */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
                  <div className="space-y-4">
                    {/* Section Selector */}
                    <div className="w-full">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Select Section
                      </label>
                      <select
                        value={selectedSection?._id || ""}
                        onChange={(e) => {
                          const sec =
                            sections.find((s) => s._id === e.target.value) ||
                            null;
                          setSelectedSection(sec);
                          setGrades({});
                        }}
                        className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select a section</option>
                        {sections.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.subject?.subjectCode} - {s.sectionName} (
                            {s.schoolYear} {s.term} Semester)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Search Students - Only show when section is selected */}
                    {selectedSection && (
                      <div className="w-full">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Search Students
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by name or student ID..."
                            value={filterTerm}
                            onChange={(e) => setFilterTerm(e.target.value)}
                            className="w-full px-3 py-2 pl-10 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <IconFilter
                            className="absolute left-3 top-2.5 text-gray-400"
                            size={16}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section Details - Responsive */}
                  {selectedSection && (
                    <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h3 className="font-medium text-blue-800 mb-3 text-sm sm:text-base flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Section Details
                      </h3>

                      {/* Details Grid - Responsive layout */}
                      <div className="space-y-2 sm:space-y-3">
                        {/* Subject Info */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="text-blue-600 font-medium text-xs sm:text-sm whitespace-nowrap">
                            Subject:
                          </span>
                          <span className="text-gray-700 text-xs sm:text-sm break-words">
                            {selectedSection.subject?.subjectCode} -{" "}
                            {selectedSection.subject?.subjectName}
                          </span>
                        </div>

                        {/* Section and Students Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-medium text-xs sm:text-sm">
                              Section:
                            </span>
                            <span className="text-gray-700 text-xs sm:text-sm">
                              {selectedSection.sectionName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-600 font-medium text-xs sm:text-sm">
                              Students:
                            </span>
                            <span className="text-gray-700 text-xs sm:text-sm font-semibold">
                              {students.length}
                            </span>
                          </div>
                        </div>

                        {/* Grading Schema */}
                        <div className="pt-2 border-t border-blue-200">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-blue-600 font-medium text-xs sm:text-sm whitespace-nowrap">
                              Grading Schema:
                            </span>
                            <div className="flex flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700">
                              <span className="px-2 py-1 bg-white rounded border">
                                CS:{" "}
                                {selectedSection.gradingSchema?.classStanding}%
                              </span>
                              <span className="px-2 py-1 bg-white rounded border">
                                Lab: {selectedSection.gradingSchema?.laboratory}
                                %
                              </span>
                              <span className="px-2 py-1 bg-white rounded border">
                                MO: {selectedSection.gradingSchema?.majorOutput}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Responsive Tabs */}
                {selectedSection && (
                  <>
                    <div className="mb-4 sm:mb-6">
                      {/* Tab Navigation - Responsive */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 hidden sm:block">
                          Grade Categories
                        </h3>

                        {/* Tab Buttons - Horizontal scroll on mobile */}
                        <div className="-mx-3 px-3 sm:mx-0 sm:px-0 overflow-x-auto">
                          <div className="flex gap-2 sm:gap-3 w-max sm:w-auto">
                            {[
                              {
                                key: "classStanding",
                                label: "Class Standing",
                                shortLabel: "Class Standing",
                              },
                              {
                                key: "laboratory",
                                label: "Laboratory Activity",
                                shortLabel: "Laboratory Activity",
                              },
                              {
                                key: "majorOutput",
                                label: "Major Output",
                                shortLabel: "Major Output",
                              },
                            ].map((t) => (
                              <button
                                key={t.key}
                                onClick={() => setActiveTab(t.key)}
                                className={[
                                  "flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg border transition-all duration-200 text-sm sm:text-base font-medium",
                                  activeTab === t.key
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400",
                                ].join(" ")}
                              >
                                {/* Show short label on very small screens, full label on larger screens */}
                                <span className="xs:hidden">
                                  {t.shortLabel}
                                </span>
                                <span className="hidden xs:inline">
                                  {t.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : filteredStudents.length ? (
                      <>
                        {activeTab === "classStanding" && (
                          <CategoryTable
                            category="classStanding"
                            title="Class Standing"
                          />
                        )}
                        {activeTab === "laboratory" && (
                          <CategoryTable
                            category="laboratory"
                            title="Laboratory Activity"
                          />
                        )}
                        {activeTab === "majorOutput" && (
                          <CategoryTable
                            category="majorOutput"
                            title="Major Output"
                          />
                        )}
                      </>
                    ) : (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="text-center py-12">
                          <IconUsers
                            className="mx-auto text-gray-300 mb-4"
                            size={48}
                          />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">
                            {filterTerm
                              ? "No students match your search"
                              : "No students in this section"}
                          </h3>
                          <p className="text-gray-500">
                            {filterTerm
                              ? "Try adjusting your search terms"
                              : "Invite students to this section to start grading"}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}
