import React from "react";

export function StatCard({ icon: Icon, total, label, sublabel, sublabelColor, iconColor }) {
  return (
    <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <Icon size={40} color={iconColor} />
        <div>
          <p className="text-xl font-bold text-gray-800">{total}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
      <p className={`mt-3 text-sm ${sublabelColor}`}>
        {sublabel}
      </p>
    </div>
  );
}
