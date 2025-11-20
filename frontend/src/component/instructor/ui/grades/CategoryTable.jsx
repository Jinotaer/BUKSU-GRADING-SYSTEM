import React from "react";
import { IconUsers } from "@tabler/icons-react";
import {
  calculateStudentTermPercent,
  calculateStudentFinalSummary,
} from "../../../../utils/gradeUtils";

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

function WeightBadge({ weight }) {
  return (
    <div className="flex-shrink-0 rounded-full px-2 sm:px-3 py-1 text-xs font-semibold bg-gray-900/80 text-white">
      {weight}%
    </div>
  );
}

export function CategoryTable({
  category,
  title,
  activities,
  students,
  weight,
  getCategoryAverage,
  getEquivalent,
  getActivityScore,
  showGrades = false,
  gradeType = null, // 'midterm', 'finalTerm', or 'final'
  getWeight = null,
  allActivities = null, // All activities grouped by category
  onExportFinalGrade = null, // Export handler
  selectedTerm = null, // Current term filter
}) {
  const tone = tones[category];

  // Grade calculation function - implements BukSU grading algorithm
  const calculateGrade = (student) => {
    if (!showGrades || !gradeType || !getWeight) return null;

    // Build grading schema from weights
    const gradingSchema = {
      classStanding: getWeight("classStanding") || 60,
      laboratory: getWeight("laboratory") || 0,
      majorOutput: getWeight("majorOutput") || 40,
    };

    if (gradeType === "midterm") {
      // Delegate midterm percentage calculation to utils
      return calculateStudentTermPercent(student, allActivities, "Midterm", gradingSchema, getActivityScore);
    } else if (gradeType === "finalTerm") {
      // Delegate final-term percentage calculation to utils
      return calculateStudentTermPercent(student, allActivities, "Finalterm", gradingSchema, getActivityScore);
    } else if (gradeType === "final") {
      // Delegate final summary calculation to utils
      return calculateStudentFinalSummary(student, allActivities, gradingSchema, getActivityScore);
    }

    return 0;
  };

  // Term/category average helper now delegated to `gradeUtils.js` when needed

  const getGradeTitle = () => {
    if (gradeType === "midterm") return "Midterm Grade";
    if (gradeType === "finalTerm") return "Final Term Grade";
    if (gradeType === "final") return "Final Grade";
    return "Grade";
  };

  // Show export button only when viewing final grades with all terms filter (empty string means all terms)
  const showExportButton =
    gradeType === "final" && selectedTerm === "" && onExportFinalGrade;

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
            {showExportButton && (
              <button
                onClick={onExportFinalGrade}
                className="px-3 mt-2 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-2"
              >
                Export HyFlex-LGS
              </button>
            )}
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

              {activities.map((a) => (
                <th
                  key={a._id}
                  className={`border border-gray-200 px-2 py-2 text-center w-20 ${tone.cell}`}
                >
                  <div className="font-medium truncate text-xs" title={a.title}>
                    {a.title.length > 8
                      ? a.title.substring(0, 8) + "..."
                      : a.title}
                  </div>
                  <div className={`text-xs ${tone.line}`}>
                    /{a.maxScore ?? 100}
                  </div>
                </th>
              ))}

              {!showGrades && (
                <>
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
                </>
              )}
              {showGrades && (
                <>
                  <th
                    className={`border border-gray-200 px-2 py-2 text-center w-20 bg-blue-100 text-xs`}
                  >
                    {gradeType === "midterm"
                      ? "Midterm %"
                      : gradeType === "finalTerm"
                      ? "Final Term %"
                      : "Final %"}
                  </th>
                  <th
                    className={`border border-gray-200 px-2 py-2 text-center w-16 bg-blue-100 text-xs`}
                  >
                    Equiv
                  </th>
                  <th
                    className={`border border-gray-200 px-2 py-2 text-center w-16 bg-blue-100 text-xs`}
                  >
                    Remarks
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {students.map((student, i) => {
              const avg = getCategoryAverage(student, category);
              const eq = getEquivalent(avg);
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

                  {activities.map((a) => {
                    const raw = getActivityScore(student, a);
                    const displayRaw = raw === "" || raw === null || raw === undefined ? null : Math.round(raw);
                    return (
                      <td
                        key={`${student._id}-${a._id}`}
                        className="border border-gray-200 px-2 py-4 text-center"
                      >
                        <div className={`font-semibold text-xs ${tone.num}`}>
                          {displayRaw !== null ? displayRaw : "-"}
                        </div>
                      </td>
                    );
                  })}

                  {!showGrades && (
                    <>
                      <td
                        className={`border border-gray-200 px-1 py-4 text-center font-semibold text-xs ${tone.cell}`}
                      >
                        {avg ? `${Math.round(avg)}%` : "0%"}
                      </td>
                      <td
                        className={`border border-gray-200 px-1 py-4 text-center font-semibold text-xs ${tone.cell}`}
                      >
                        {category === "laboratory" && weight === 0
                          ? "0.00"
                          : eq}
                      </td>
                    </>
                  )}
                  {showGrades &&
                    (() => {
                      const grade = calculateGrade(student);
                      const isFinalGrade = gradeType === "final";

                      let gradePercent, gradeEquiv, isPassing, remarks;

                      if (isFinalGrade && grade?.isFinal) {
                        // For final grade, use the complete BukSU algorithm
                        gradePercent = grade.finalGradeNumeric; // Numeric average
                        gradeEquiv = grade.equivalentGrade; // Final grade from Table 3
                        const gradeValue = parseFloat(gradeEquiv);
                        isPassing = gradeValue <= 3.0;
                        remarks =
                          grade.remarks || (isPassing ? "PASSED" : "FAILED");
                      } else {
                        // For term grades (midterm/finalTerm), show percentage
                        gradePercent = grade || 0;
                        gradeEquiv = getEquivalent(gradePercent); // Use Table 1
                        const gradeValue = parseFloat(gradeEquiv);
                        isPassing = gradeValue <= 3.0; // 3.00 and below is passing
                        remarks = isPassing ? "PASSED" : "FAILED";
                      }

                      return (
                        <>
                          <td className="border border-gray-200 px-1 py-4 text-center font-semibold text-xs bg-blue-50">
                            {isFinalGrade
                              ? gradePercent.toFixed(2)
                              : `${Math.round(gradePercent)}%`}
                          </td>
                          <td className="border border-gray-200 px-1 py-4 text-center font-semibold text-xs bg-blue-50">
                            <span
                              className={
                                isPassing ? "text-green-600" : "text-red-600"
                              }
                            >
                              {gradeEquiv}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-1 py-4 text-center text-xs bg-blue-50">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                isPassing
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {remarks}
                            </span>
                          </td>
                        </>
                      );
                    })()}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden">
        {students.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {students.map((student, i) => {
              const avg = getCategoryAverage(student, category);
              const eq = getEquivalent(avg);
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
                      {!showGrades && (
                        <>
                          <div className="text-xs text-gray-500">Average</div>
                          <div className="text-sm sm:text-base font-bold text-gray-900">
                            {avg ? `${Math.round(avg)}%` : "0%"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Grade:{" "}
                            {category === "laboratory" && weight === 0
                              ? "0.00"
                              : eq}
                          </div>
                        </>
                      )}
                      {showGrades &&
                        (() => {
                          const grade = calculateGrade(student);
                          const isFinalGrade = gradeType === "final";

                          let gradePercent, gradeEquiv, isPassing, remarks;

                          if (isFinalGrade && grade?.isFinal) {
                            // For final grade, use the already calculated values
                            gradePercent = grade.finalGradeNumeric;
                            gradeEquiv = grade.equivalentGrade; // Final grade from Table 3
                            const gradeValue = parseFloat(gradeEquiv);
                            isPassing = gradeValue <= 3.0;
                            remarks =
                              grade.remarks ||
                              (isPassing ? "PASSED" : "FAILED");
                          } else {
                            // For term grades (midterm/finalTerm), show percentage
                            gradePercent = grade || 0;
                            gradeEquiv = getEquivalent(gradePercent); // Use Table 1
                            const gradeValue = parseFloat(gradeEquiv);
                            isPassing = gradeValue <= 3.0; // 3.00 and below is passing
                            remarks = isPassing ? "PASSED" : "FAILED";
                          }

                          return (
                            <div className="mt-2 p-2 bg-blue-50 rounded border">
                              <div className="text-xs text-blue-600 font-medium">
                                {getGradeTitle()}
                              </div>
                              <div className="text-sm font-bold text-blue-900">
                                {isFinalGrade
                                  ? gradePercent.toFixed(2)
                                  : `${Math.round(gradePercent)}%`}
                              </div>
                              <div className="text-xs mt-1">
                                <span className="text-gray-600">Equiv: </span>
                                <span
                                  className={
                                    isPassing
                                      ? "text-green-600 font-semibold"
                                      : "text-red-600 font-semibold"
                                  }
                                >
                                  {gradeEquiv}
                                </span>
                                <span className="mx-1">•</span>
                                <span
                                  className={
                                    isPassing
                                      ? "text-green-600 font-semibold"
                                      : "text-red-600 font-semibold"
                                  }
                                >
                                  {remarks}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                    </div>
                  </div>

                  {/* Activities Grid */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2">
                    {activities.map((a) => {
                      const raw = getActivityScore(student, a);
                      const max = a.maxScore ?? 100;
                      const displayRaw = raw === "" || raw === null || raw === undefined ? null : Math.round(raw);
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
                            {displayRaw !== null ? `${displayRaw}/${max}` : "-"}
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
}
