import React from "react";
import { IconRefresh, IconBrandGoogle } from "@tabler/icons-react";

export function MobileActionButtons({ onRefresh, onExport, loading, disabled }) {
  return (
    <div className="lg:hidden flex flex-col xs:flex-row gap-2">
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm font-medium"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <IconRefresh size={16} />
        )}
        <span>Refresh</span>
      </button>
      <button
        onClick={onExport}
        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
        disabled={disabled}
      >
        <IconBrandGoogle size={16} />
        <span>Export to Sheets</span>
      </button>
    </div>
  );
}
