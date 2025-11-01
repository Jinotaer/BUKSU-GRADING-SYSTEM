import React from "react";
import { getCategoryColors } from "./activityConstants";
import { PercentBadge } from "./PercentBadge";

export function CategoryCard({ name, weightLabel, percent, rows = [] }) {
  const colors = getCategoryColors(name);
  
  return (
    <section className={`rounded-2xl border-2 ${colors.border} bg-white shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl`}>
      {/* Gradient Header */}
      <div className={`bg-gradient-to-r ${colors.gradient} px-6 py-5`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
            <p className="text-sm text-white/90">{weightLabel}</p>
          </div>
          <PercentBadge value={percent} color={colors.badge} />
        </div>
      </div>

      {/* Table Content */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className={`${colors.light} border-b-2 ${colors.border}`}>
                <th className={`font-semibold text-left py-3 px-4 ${colors.text}`}>Activity</th>
                <th className={`font-semibold text-left py-3 px-4 ${colors.text}`}>Score</th>
                <th className={`font-semibold text-left py-3 px-4 ${colors.text}`}>Percentage</th>
                <th className={`font-semibold text-left py-3 px-4 ${colors.text}`}>Date Posted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, idx) => (
                <tr key={idx} className={`${colors.hover} transition-colors duration-150`}>
                  <td className="py-4 px-4 font-medium text-gray-800">{r.item}</td>
                  <td className="py-4 px-4 text-gray-700 font-semibold">{r.score}</td>
                  <td className={`py-4 px-4 font-bold ${colors.text} text-base`}>{r.percentage}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-gray-500">{r.date}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                    No activities posted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
