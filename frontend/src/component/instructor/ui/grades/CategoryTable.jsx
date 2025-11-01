import React from "react";
import { IconUsers } from "@tabler/icons-react";

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
}) {
  const tone = tones[category];

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
          <WeightBadge weight={weight} />
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
                      <div className="text-xs text-gray-500">Average</div>
                      <div className="text-sm sm:text-base font-bold text-gray-900">
                        {avg ? `${avg.toFixed(1)}%` : "0%"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Grade: {eq.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Activities Grid */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2">
                    {activities.map((a) => {
                      const raw = getActivityScore(student, a);
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
}
