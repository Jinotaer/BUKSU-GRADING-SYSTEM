import React from "react";
import { IconChevronLeft, IconPlus } from "@tabler/icons-react";

// Compact percentage with a tiny progress bar (right side of each card header)
function PercentBadge({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="flex flex-col items-end gap-2 min-w-[110px]">
      <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full bg-gray-900 text-white">
        {pct.toFixed(2)}%
      </span>
      <div className="w-28 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full bg-gray-900 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CategoryCard({ name, weightLabel, percent, rows = [] }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500">{weightLabel}</p>
        </div>
        <PercentBadge value={percent} />
      </div>

      {/* Table */}
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="font-medium text-left pb-3">Item</th>
              <th className="font-medium text-left pb-3">Score</th>
              <th className="font-medium text-left pb-3">Percentage</th>
              <th className="font-medium text-left pb-3">Date Posted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, idx) => (
              <tr key={idx} className="text-gray-700">
                <td className="py-3 pr-4">{r.item}</td>
                <td className="py-3 pr-4">{r.score}</td>
                <td className="py-3 pr-4 font-medium text-emerald-600">{r.percentage}</td>
                <td className="py-3 whitespace-nowrap text-gray-500">{r.date}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-400">
                  No items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function GradeBreakdown({ title, subtitle = "Detailed Grade Breakdown", onBack, onAddActivity, categories = [] }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
          >
            <IconChevronLeft size={18} /> Back
          </button>

          <button
            onClick={onAddActivity}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <IconPlus size={16} /> Add activity
          </button>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>

        <div className="mt-6 space-y-6">
          {categories.map((cat) => (
            <CategoryCard key={cat.name} name={cat.name} weightLabel={cat.weightLabel} percent={cat.percent} rows={cat.rows} />)
          )}
        </div>
      </div>
    </div>
  );
}

// Demo component for quick preview in ChatGPT canvas. Replace with your data when integrating.
export default function GradeBreakdownDemo() {
  const categories = [
    {
      name: "Class Standing",
      weightLabel: "Weight: 30% of final grade",
      percent: 88.33,
      rows: [
        { item: "Quiz 1", score: "18/20", percentage: "90.0%", date: "Sep 15" },
        { item: "Quiz 2", score: "17/20", percentage: "85.0%", date: "Oct 1" },
        { item: "Quiz 3", score: "18/20", percentage: "90.0%", date: "Oct 26" },
      ],
    },
    {
      name: "Laboratory",
      weightLabel: "Weight: 30% of final grade",
      percent: 91.0,
      rows: [
        { item: "Assignment 1 - HTML/CSS", score: "95/100", percentage: "95.0%", date: "Sep 20" },
        { item: "Assignment 2 - JavaScript", score: "88/100", percentage: "88.0%", date: "Oct 10" },
        { item: "Assignment 3 - React", score: "90/100", percentage: "90.0%", date: "Oct 28" },
      ],
    },
    {
      name: "Major Output",
      weightLabel: "Weight: 40% of final grade",
      percent: 86.0,
      rows: [
        { item: "Midterm Exam", score: "86/100", percentage: "86.0%", date: "Oct 15" },
      ],
    },
  ];

  return (
    <GradeBreakdown
      title="IT 101 - Web Development"
      onBack={() => alert("Back clicked")}
      onAddActivity={() => alert("Add activity")}
      categories={categories}
    />
  );
}
