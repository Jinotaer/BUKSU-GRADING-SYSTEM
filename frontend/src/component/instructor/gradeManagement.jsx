import React, { useState, useEffect, useCallback, useRef } from "react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import { 
  getEquivalentGrade, 
  getTermEquivalentGrade, 
  getFinalEquivalentGrade 
} from "../../utils/gradeUtils";
import {
  PageHeader,
  MobileHeader,
  MobileActionButtons,
  SectionSelector,
  SectionDetails,
  TabNavigation,
  CategoryTable,
  EmptyState,
  ScheduleModal,
  LoadingSpinner,
} from "./ui/grades";

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
  const [_grades, setGrades] = useState({});
  const [activities, setActivities] = useState({
    classStanding: [],
    laboratory: [],
    majorOutput: [],
  });
  const [loading, setLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [activeTab, setActiveTab] = useState("classStanding");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    day: "",
    time: "",
    room: "",
    chairperson: "",
    dean: "",
  });

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
      const allActivities = data.activities || [];
      
      // Filter by term if selected
      const filteredByTerm = selectedTerm 
        ? allActivities.filter((a) => a.term === selectedTerm)
        : allActivities;
      
      const organized = {
        classStanding:
          filteredByTerm.filter((a) => a.category === "classStanding") || [],
        laboratory:
          filteredByTerm.filter((a) => a.category === "laboratory") || [],
        majorOutput:
          filteredByTerm.filter((a) => a.category === "majorOutput") || [],
      };
      setActivities(organized);
      return organized;
    } catch (err) {
      console.error("Error fetching activities:", err);
      return null;
    }
  }, [selectedSection?._id, selectedTerm]);

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
    const loadSectionData = async () => {
      if (!selectedSection?._id) return;
      
      // First fetch activities
      const fetchedActivities = await fetchActivities();
      
      // Then fetch students and grades with the fetched activities
      if (fetchedActivities) {
        await fetchStudentsAndGrades(fetchedActivities);
      }
    };
    
    loadSectionData();
  }, [selectedSection?._id, selectedTerm, fetchActivities, fetchStudentsAndGrades]);

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

  const openScheduleModal = () => {
    if (!selectedSection) return;
    
    // Pre-fill form with existing schedule data or defaults
    setScheduleForm({
      day: selectedSection.schedule?.day || "",
      time: selectedSection.schedule?.time || "",
      room: selectedSection.schedule?.room || "",
      chairperson: selectedSection.chairperson || "",
      dean: selectedSection.dean || "",
    });
    
    setShowScheduleModal(true);
  };

  const exportToGoogleSheets = async () => {
    if (!selectedSection) return;

  // Parent Drive folder where per-section folders will be created
  const PARENT_FOLDER_ID = "1kzlYesJutCqHSMa3WEf8sq7CrUoMixXi";

  const getSheetName = (section) => {
    if (!section) return `Sheet_${Date.now()}`;

    const extract = (val, keys = []) => {
      if (!val) return '';
      if (typeof val === 'string') return val.trim();
      if (typeof val === 'number') return String(val);
      if (typeof val === 'object') {
        for (const k of keys) {
          if (val[k]) return String(val[k]);
        }
      }
      return '';
    };

    const subjectCode =
      extract(section.subject, ['code', 'subjectCode', 'subjectName', 'name']) ||
      extract(section, ['subjectCode', 'subject']) ||
      '';
    const sectionCode =
      extract(section, ['sectionCode', 'code', 'sectionName', 'section']) ||
      extract(section, ['code', 'section']) ||
      '';
    const term =
      extract(section.semester, ['term', 'name']) || extract(section, ['term', 'semester']) || '';

    const parts = [subjectCode, sectionCode, term].map((p) => p && String(p).replace(/\s+/g, '')).filter(Boolean);
    return parts.length ? parts.join('_') : `Section_${section._id}`;
  };

  // Validate form
  if (
    !scheduleForm.day ||
    !scheduleForm.time ||
    !scheduleForm.room ||
    !scheduleForm.chairperson ||
    !scheduleForm.dean
  ) {
    showErrorRef.current("Please fill in all schedule information");
    return;
  }

    try {
      // Debug: log payload so we can inspect sheetName/parentFolderId when troubleshooting
      console.log('[gradeManagement] export payload preview:', {
        schedule: { day: scheduleForm.day, time: scheduleForm.time, room: scheduleForm.room },
        chairperson: scheduleForm.chairperson,
        dean: scheduleForm.dean,
        parentFolderId: PARENT_FOLDER_ID,
        sheetName: getSheetName(selectedSection),
      });
      setLoading(true);
      setShowScheduleModal(false);
      showSuccessRef.current("Exporting to Google Sheets...");

      const res = await authenticatedFetch(
        `http://localhost:5000/api/export/google-sheets/${selectedSection._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            schedule: {
              day: scheduleForm.day,
              time: scheduleForm.time,
              room: scheduleForm.room,
            },
            chairperson: scheduleForm.chairperson,
            dean: scheduleForm.dean,
            parentFolderId: PARENT_FOLDER_ID,
            sheetName: getSheetName(selectedSection),
            term: selectedTerm || undefined, // Include term filter if selected
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to export to Google Sheets");
      }

      const data = await res.json();

      showSuccessRef.current("Successfully exported to Google Sheets!");

      // Open the spreadsheet in a new tab
      if (data.spreadsheetUrl) {
        window.open(data.spreadsheetUrl, "_blank");
      }
    } catch (error) {
      console.error("Export error:", error);
      showErrorRef.current(
        error.message || "Failed to export to Google Sheets"
      );
    } finally {
      setLoading(false);
    }
  };

  const exportFinalGradeToGoogleSheets = async () => {
    if (!selectedSection) return;

    // Parent Drive folder where per-section folders will be created
    const PARENT_FOLDER_ID = "1kzlYesJutCqHSMa3WEf8sq7CrUoMixXi";

    const getSheetName = (section) => {
      if (!section) return `FinalGrade_${Date.now()}`;

      const extract = (val, keys = []) => {
        if (!val) return '';
        if (typeof val === 'string') return val.trim();
        if (typeof val === 'number') return String(val);
        if (typeof val === 'object') {
          for (const k of keys) {
            if (val[k]) return String(val[k]);
          }
        }
        return '';
      };

      const subjectCode =
        extract(section.subject, ['code', 'subjectCode', 'subjectName', 'name']) ||
        extract(section, ['subjectCode', 'subject']) ||
        '';
      const sectionCode =
        extract(section, ['sectionCode', 'code', 'sectionName', 'section']) ||
        extract(section, ['code', 'section']) ||
        '';
      const term =
        extract(section.semester, ['term', 'name']) || extract(section, ['term', 'semester']) || '';

      const parts = [subjectCode, sectionCode, 'FinalGrade', term].map((p) => p && String(p).replace(/\s+/g, '')).filter(Boolean);
      return parts.length ? parts.join('_') : `FinalGrade_${section._id}`;
    };

    // Use default schedule values for final grade export
    const defaultSchedule = {
      day: selectedSection.schedule?.day || 'TBA',
      time: selectedSection.schedule?.time || 'TBA', 
      room: selectedSection.schedule?.room || 'TBA'
    };
    const defaultChairperson = selectedSection.chairperson || 'TBA';
    const defaultDean = selectedSection.dean || 'TBA';

    try {
      console.log('[gradeManagement] final grade export payload preview:', {
        schedule: defaultSchedule,
        chairperson: defaultChairperson,
        dean: defaultDean,
        parentFolderId: PARENT_FOLDER_ID,
        sheetName: getSheetName(selectedSection),
        term: 'Final Grade'
      });
      
      setLoading(true);
      showSuccessRef.current("Exporting Final Grade to Google Sheets...");

      const res = await authenticatedFetch(
        `http://localhost:5000/api/export/google-sheets/${selectedSection._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            schedule: defaultSchedule,
            chairperson: defaultChairperson,
            dean: defaultDean,
            parentFolderId: PARENT_FOLDER_ID,
            sheetName: getSheetName(selectedSection),
            term: "Final Grade", // Special term to trigger final grade export
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to export final grade to Google Sheets");
      }

      const data = await res.json();

      showSuccessRef.current("Final Grade successfully exported to Google Sheets!");

      // Open the spreadsheet in a new tab
      if (data.spreadsheetUrl) {
        window.open(data.spreadsheetUrl, "_blank");
      }
    } catch (error) {
      console.error("Final grade export error:", error);
      showErrorRef.current(
        error.message || "Failed to export final grade to Google Sheets"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------- rendering helpers ---------- */
  // Table 1: Grade Category Equivalency - converts percentage to equivalent grade
  const eqFromPercent = (avg) => {
    if (avg === "" || avg === null || avg === undefined || isNaN(Number(avg))) {
      return "5.00";
    }

    const score = Number(avg);
    
    // Table 1: BukSU Grading Scale (Percentage to Grade)
    if (score >= 97) return "1.00";  // 97-100 = Excellent
    if (score >= 94) return "1.25";  // 94-96 = Very Good
    if (score >= 91) return "1.50";  // 91-93 = Good
    if (score >= 88) return "1.75";  // 88-90 = Satisfactory
    if (score >= 85) return "2.00";  // 85-87 = Passing
    if (score >= 82) return "2.25";  // 82-84 = Fair
    if (score >= 79) return "2.50";  // 79-81 = Fair
    if (score >= 76) return "2.75";  // 76-78 = Fair
    if (score >= 75) return "3.00";  // 75 = Conditional/Passing
    
    // Below 75 is failing
    return "5.00";  // Failed
  };

  // Table 2: Term Grade Equivalency - converts numeric grade to equivalent grade
  const getTermEquivalentGrade = (numericGrade) => {
    if (numericGrade === "" || numericGrade === null || numericGrade === undefined || isNaN(Number(numericGrade))) {
      return "5.00";
    }

    const grade = Number(numericGrade);
    
    // Table 2: Term Grade Equivalency Table
    if (grade >= 0 && grade <= 1.1250) return "1.00";
    if (grade >= 1.1251 && grade <= 1.3750) return "1.25";
    if (grade >= 1.3751 && grade <= 1.6250) return "1.50";
    if (grade >= 1.6251 && grade <= 1.8750) return "1.75";
    if (grade >= 1.8751 && grade <= 2.1250) return "2.00";
    if (grade >= 2.1251 && grade <= 2.3750) return "2.25";
    if (grade >= 2.3751 && grade <= 2.6250) return "2.50";
    if (grade >= 2.6251 && grade <= 2.8750) return "2.75";
    if (grade >= 2.8751 && grade <= 3.1250) return "3.00";
    if (grade >= 3.1251 && grade <= 3.3750) return "3.25";
    if (grade >= 3.3751 && grade <= 3.6250) return "3.50";
    if (grade >= 3.6251 && grade <= 9) return "5.00";
    
    // Above 9 or invalid
    return "5.00";  // Failed
  };

  const getWeight = (cat) => {
    const gs = selectedSection?.gradingSchema || {};
    return cat === "classStanding"
      ? gs.classStanding ?? 0
      : cat === "laboratory"
      ? gs.laboratory ?? 0
      : gs.majorOutput ?? 0;
  };

  const categoryAverage = (student, cat) => {
    const acts = activities?.[cat] ?? [];
    if (!acts.length) return 0;
    
    // Use weighted calculation (matches backend logic)
    // This properly accounts for different activity point values
    let totalEarned = 0;
    let totalMax = 0;
    
    acts.forEach((activity) => {
      const hit = student.activityScores?.find(
        (s) => String(s.activity_id) === String(activity._id)
      ) || student.grades?.find(
        (g) => String(g.activity_id) === String(activity._id)
      );
      const earned = Number(hit?.score ?? 0);
      const max = Number(hit?.maxScore ?? activity?.maxScore ?? 100);
      
      totalEarned += earned;
      totalMax += max;
    });
    
    return totalMax > 0 ? (totalEarned / totalMax) * 100 : 0;
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(filterTerm.toLowerCase()) ||
      s.studid?.toLowerCase().includes(filterTerm.toLowerCase())
  );

  const getActivityScore = (student, activity) => {
    const hit =
      student.activityScores?.find(
        (s) => String(s.activity_id) === String(activity._id)
      ) ||
      student.grades?.find(
        (g) => String(g.activity_id) === String(activity._id)
      );
    return Number(hit?.score ?? 0);
  };

  /* ---------- early load ---------- */
  if (loading && !selectedSection) {
    return <LoadingSpinner />;
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
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto ml-0 max-[880px]:ml-0 min-[881px]:ml-65 max-[880px]:pt-20 mt-10">
          <div className="min-h-screen">
            {/* Mobile header */}
            <div className="lg:hidden px-4 py-3">
              <InstructorSidebar />
            </div>

            <MobileHeader />

            {/* Content area */}
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto space-y-6">
                <PageHeader
                  onRefresh={refreshData}
                  onExport={openScheduleModal}
                  onExportFinalGrade={exportFinalGradeToGoogleSheets}
                  loading={loading}
                  disabled={!selectedSection || !students.length}
                />

                <MobileActionButtons
                  onRefresh={refreshData}
                  onExport={openScheduleModal}
                  loading={loading}
                  disabled={!selectedSection || !students.length}
                />

                <SectionSelector
                  selectedSection={selectedSection}
                  sections={sections}
                  onSectionChange={(section) => {
                    setSelectedSection(section);
                    setGrades({});
                  }}
                  filterTerm={filterTerm}
                  onFilterChange={setFilterTerm}
                  selectedTerm={selectedTerm}
                  onTermChange={setSelectedTerm}
                />

                {selectedSection && (
                  <SectionDetails section={selectedSection} studentCount={students.length} />
                )}

                {selectedSection && (
                  <>
                    <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} selectedTerm={selectedTerm} />

                    {loading ? (
                      <LoadingSpinner />
                    ) : filteredStudents.length ? (
                      <>
                        {activeTab === "classStanding" && (
                          <CategoryTable
                            category="classStanding"
                            title="Class Standing"
                            activities={activities.classStanding || []}
                            students={filteredStudents}
                            weight={getWeight("classStanding")}
                            getCategoryAverage={categoryAverage}
                            getEquivalent={getEquivalentGrade}
                            getActivityScore={getActivityScore}
                          />
                        )}
                        {activeTab === "laboratory" && (
                          <CategoryTable
                            category="laboratory"
                            title="Laboratory Activity"
                            activities={activities.laboratory || []}
                            students={filteredStudents}
                            weight={getWeight("laboratory")}
                            getCategoryAverage={categoryAverage}
                            getEquivalent={getEquivalentGrade}
                            getActivityScore={getActivityScore}
                          />
                        )}
                        {activeTab === "majorOutput" && (
                          <CategoryTable
                            category="majorOutput"
                            title="Major Output"
                            activities={activities.majorOutput || []}
                            students={filteredStudents}
                            weight={getWeight("majorOutput")}
                            getCategoryAverage={categoryAverage}
                            getEquivalent={getEquivalentGrade}
                            getActivityScore={getActivityScore}
                          />
                        )}
                        {activeTab === "midtermGrade" && (
                          <CategoryTable
                            category="classStanding"
                            title="Midterm Grade Summary"
                            activities={[]}
                            students={filteredStudents}
                            weight={100}
                            getCategoryAverage={categoryAverage}
                            getEquivalent={getEquivalentGrade}
                            getActivityScore={getActivityScore}
                            showGrades={true}
                            gradeType="midterm"
                            getWeight={getWeight}
                            allActivities={activities}
                            getTermEquivalentGrade={getTermEquivalentGrade}
                          />
                        )}
                        {activeTab === "finalTermGrade" && (
                          <CategoryTable
                            category="laboratory"
                            title="Final Term Grade Summary"
                            activities={[]}
                            students={filteredStudents}
                            weight={100}
                            getCategoryAverage={categoryAverage}
                            getEquivalent={getEquivalentGrade}
                            getActivityScore={getActivityScore}
                            showGrades={true}
                            gradeType="finalTerm"
                            getWeight={getWeight}
                            allActivities={activities}
                            getTermEquivalentGrade={getTermEquivalentGrade}
                          />
                        )}
                        {activeTab === "finalGrade" && (
                          <CategoryTable
                            category="majorOutput"
                            title="Final Grade Summary"
                            activities={[]}
                            students={filteredStudents}
                            weight={100}
                            getCategoryAverage={categoryAverage}
                            getEquivalent={getEquivalentGrade}
                            getActivityScore={getActivityScore}
                            showGrades={true}
                            gradeType="final"
                            getWeight={getWeight}
                            allActivities={activities}
                            getTermEquivalentGrade={getFinalEquivalentGrade}
                          />
                        )}
                      </>
                    ) : (
                      <EmptyState hasFilter={!!filterTerm} />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <ScheduleModal
          isOpen={showScheduleModal}
          scheduleForm={scheduleForm}
          onScheduleChange={setScheduleForm}
          onClose={() => setShowScheduleModal(false)}
          onExport={exportToGoogleSheets}
          loading={loading}
        />
      </div>
    </NotificationProvider>
  );
}
