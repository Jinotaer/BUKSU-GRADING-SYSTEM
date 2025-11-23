import React, { useState, useEffect, useCallback, useRef } from "react";
import { InstructorSidebar } from "./instructorSidebar";
import { authenticatedFetch } from "../../utils/auth";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationProvider } from "../common/NotificationModals";
import { 
  getEquivalentGrade, 
  calculateCategoryAverage,
  calculateStudentFinalSummary,
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
  const [allActivitiesUnfiltered, setAllActivitiesUnfiltered] = useState({
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

  // Helper to determine if section has laboratory component
  const hasLaboratory = useCallback(() => {
    if (!selectedSection) return false;
    const schema = selectedSection.gradingSchema;
    if (schema && typeof schema === 'object') {
      return Boolean(schema.laboratory && Number(schema.laboratory) > 0);
    }
    // Fallback to legacy hasLab property
    return Boolean(selectedSection.hasLab);
  }, [selectedSection]);

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

  const fetchActivities = useCallback(async (termFilter = null) => {
    if (!selectedSection?._id) return null;
    try {
      const res = await authenticatedFetch(
        `http://localhost:5000/api/instructor/sections/${selectedSection._id}/activities`
      );
      if (!res.ok) return null;
      const data = await res.json();
      const allActivities = data.activities || [];
      
      // Store unfiltered activities organized by category (for grade calculations)
      const unfilteredOrganized = {
        classStanding:
          allActivities.filter((a) => a.category === "classStanding") || [],
        laboratory:
          allActivities.filter((a) => a.category === "laboratory") || [],
        majorOutput:
          allActivities.filter((a) => a.category === "majorOutput") || [],
      };
      
      // Filter by term if specified (for display tabs)
      const filteredByTerm = termFilter 
        ? allActivities.filter((a) => a.term === termFilter)
        : allActivities;
      
      const organized = {
        classStanding:
          filteredByTerm.filter((a) => a.category === "classStanding") || [],
        laboratory:
          filteredByTerm.filter((a) => a.category === "laboratory") || [],
        majorOutput:
          filteredByTerm.filter((a) => a.category === "majorOutput") || [],
      };
      
      return { organized, unfilteredOrganized };
    } catch (err) {
      console.error("Error fetching activities:", err);
      return null;
    }
  }, [selectedSection?._id]);

  const fetchStudentsAndGrades = useCallback(
    async (currentActivities, unfilteredActivities) => {
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

        // 4) attach activityScores per student and compute final summaries
        const studentsWithScores = roster.map((student) => {
          const activityScores = allActivities.map((a) => {
            const rows = activityRowsMap.get(String(a._id)) || [];
            const hit = rows.find((row) => row.studentId === student._id);
            return {
              activity_id: a._id,
              // If there's no hit (no score row), treat it as blank (null)
              score: hit ? (hit.score === null || hit.score === undefined || hit.score === "" ? null : Number(hit.score)) : null,
              maxScore: Number(hit?.maxScore ?? a.maxScore ?? 100),
            };
          });
          return { ...student, activityScores };
        });

        // Attach computed grade summaries using centralized utils.
        const studentsWithSummaries = studentsWithScores.map((stu) => {
          // helper to read a student's score for an activity (returns null for blank)
          const getScoreForActivity = (studentObj, activity) => {
            const hit = (studentObj.activityScores || []).find(
              (r) => String(r.activity_id) === String(activity._id)
            );
            if (!hit || hit.score === null || hit.score === undefined || hit.score === "") return null;
            return Number(hit.score);
          };

          // grading schema or legacy hasLab flag
          const gradingSchemaOrHasLab = selectedSection?.gradingSchema ?? selectedSection?.hasLab ?? false;

          // Compute final summary (includes midterm/final percents and final equivalent)
          const summary = calculateStudentFinalSummary(
            stu,
            unfilteredActivities,
            gradingSchemaOrHasLab,
            getScoreForActivity
          );

          return { ...stu, grade: { ...(stu.grade || {}), ...summary } };
        });

        setStudents(studentsWithSummaries);

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
    [selectedSection, showErrorRef]
  );

  /* ---------- effects ---------- */
  useEffect(() => {
    fetchInstructorSections();
  }, [fetchInstructorSections]);

  useEffect(() => {
    const loadSectionData = async () => {
      if (!selectedSection?._id) return;
      
      try {
        setLoading(true);
        
        // Fetch activities with current term filter
        const result = await fetchActivities(selectedTerm);
        
        if (result) {
          const { organized, unfilteredOrganized } = result;
          
          // Update state
          setActivities(organized);
          setAllActivitiesUnfiltered(unfilteredOrganized);
          
          // Fetch students and grades with the fetched activities
          await fetchStudentsAndGrades(organized, unfilteredOrganized);
        }
      } catch (error) {
        console.error('Error loading section data:', error);
        showErrorRef.current('Failed to load section data');
      } finally {
        setLoading(false);
      }
    };
    
    loadSectionData();
  }, [selectedSection?._id, selectedTerm, fetchActivities, fetchStudentsAndGrades, showErrorRef]);

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

  // Effect to handle tab switching when laboratory becomes unavailable
  useEffect(() => {
    if (selectedSection && activeTab === "laboratory" && !hasLaboratory()) {
      // Switch to classStanding tab if laboratory tab is no longer available
      setActiveTab("classStanding");
    }
  }, [selectedSection, activeTab, hasLaboratory]);

  // refresh every 5 minutes
  const refreshRef = useRef(null);
  const selectedSectionIdRef = useRef(selectedSection?._id);
  const selectedTermRef = useRef(selectedTerm);
  const fetchStudentsAndGradesRef = useRef(fetchStudentsAndGrades);
  
  useEffect(() => {
    selectedSectionIdRef.current = selectedSection?._id;
  }, [selectedSection?._id]);
  
  useEffect(() => {
    selectedTermRef.current = selectedTerm;
  }, [selectedTerm]);
  
  useEffect(() => {
    fetchStudentsAndGradesRef.current = fetchStudentsAndGrades;
  }, [fetchStudentsAndGrades]);
  
  useEffect(() => {
    if (refreshRef.current) {
      clearInterval(refreshRef.current);
      refreshRef.current = null;
    }
    
    if (selectedSection?._id) {
      refreshRef.current = setInterval(async () => {
        if (!selectedSectionIdRef.current) return;
        
        try {
          const res = await authenticatedFetch(
            `http://localhost:5000/api/instructor/sections/${selectedSectionIdRef.current}/activities`
          );
          if (!res.ok) return;
          const data = await res.json();
          const allActivities = data.activities || [];
          
          const unfilteredOrganized = {
            classStanding: allActivities.filter((a) => a.category === "classStanding") || [],
            laboratory: allActivities.filter((a) => a.category === "laboratory") || [],
            majorOutput: allActivities.filter((a) => a.category === "majorOutput") || [],
          };
          
          const filteredByTerm = selectedTermRef.current 
            ? allActivities.filter((a) => a.term === selectedTermRef.current)
            : allActivities;
          
          const organized = {
            classStanding: filteredByTerm.filter((a) => a.category === "classStanding") || [],
            laboratory: filteredByTerm.filter((a) => a.category === "laboratory") || [],
            majorOutput: filteredByTerm.filter((a) => a.category === "majorOutput") || [],
          };
          
          setAllActivitiesUnfiltered(unfilteredOrganized);
          setActivities(organized);
          
          // Refresh students with latest activities
          await fetchStudentsAndGradesRef.current(organized, unfilteredOrganized);
        } catch (error) {
          console.error('Auto-refresh error:', error);
        }
      }, 300000);
    }
    
    return () => {
      if (refreshRef.current) {
        clearInterval(refreshRef.current);
        refreshRef.current = null;
      }
    };
  }, [selectedSection?._id]); // Only depend on section ID change

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      await fetchInstructorSections();
      
      const result = await fetchActivities(selectedTerm);
      if (result) {
        const { organized, unfilteredOrganized } = result;
        setActivities(organized);
        setAllActivitiesUnfiltered(unfilteredOrganized);
        await fetchStudentsAndGrades(organized, unfilteredOrganized);
      }
      
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
    selectedTerm,
    showSuccessRef,
    showErrorRef
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
        `http://localhost:5000/api/export/final-grade/${selectedSection._id}`,
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
  // Use shared grade utility functions from utils/gradeUtils.js (imported at top)

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

    // Delegate calculation to shared utility. It expects (activities, student, getActivityScore)
    return calculateCategoryAverage(acts, student, getActivityScore);
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
    // Only display a number if score is not blank (null, undefined, empty string)
    if (hit?.score === null || hit?.score === undefined || hit?.score === "") {
      return "";
    }
    return Number(hit.score);
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
                    <TabNavigation 
                      activeTab={activeTab} 
                      onTabChange={setActiveTab} 
                      selectedTerm={selectedTerm}
                      hasLaboratory={hasLaboratory()}
                    />

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
                            selectedTerm={selectedTerm}
                          />
                        )}
                        {activeTab === "laboratory" && hasLaboratory() && (
                          <CategoryTable
                            category="laboratory"
                            title="Laboratory Activity"
                            activities={activities.laboratory || []}
                            students={filteredStudents}
                            weight={getWeight("laboratory")}
                            getCategoryAverage={categoryAverage}
                            getEquivalent={getEquivalentGrade}
                            getActivityScore={getActivityScore}
                            selectedTerm={selectedTerm}
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
                            selectedTerm={selectedTerm}
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
                            allActivities={allActivitiesUnfiltered}
                          />
                        )}
                        {activeTab === "finalTermGrade" && (
                          <CategoryTable
                            category="laboratory"
                            title="Finalterm Grade Summary"
                            activities={[]}
                            students={filteredStudents}
                            weight={100}
                            getCategoryAverage={categoryAverage}
                            getEquivalent={getEquivalentGrade}
                            getActivityScore={getActivityScore}
                            showGrades={true}
                            gradeType="finalTerm"
                            getWeight={getWeight}
                            allActivities={allActivitiesUnfiltered}
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
                            allActivities={allActivitiesUnfiltered}
                            onExportFinalGrade={exportFinalGradeToGoogleSheets}
                            selectedTerm={selectedTerm}
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
