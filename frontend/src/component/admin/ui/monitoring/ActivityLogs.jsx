import React, { useEffect, useState } from "react";
import {
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconEye,
  IconX,
} from "@tabler/icons-react";

const categoryColors = {
  AUTHENTICATION: "bg-purple-100 text-purple-800",
  USER_MANAGEMENT: "bg-green-100 text-green-800",
  ACADEMIC_MANAGEMENT: "bg-blue-100 text-blue-800",
  GRADE_MANAGEMENT: "bg-indigo-100 text-indigo-800",
  SYSTEM: "bg-gray-100 text-gray-800",
  SECURITY: "bg-red-100 text-red-800",
  STUDENT_ACTIVITY: "bg-cyan-100 text-cyan-800",
  INSTRUCTOR_ACTIVITY: "bg-emerald-100 text-emerald-800",
  PROFILE_MANAGEMENT: "bg-pink-100 text-pink-800",
};

const formatJsonPreview = (value) => {
  if (!value) {
    return "N/A";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const truncateText = (value, maxLength = 110) => {
  if (!value) {
    return "N/A";
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
};

// D078: Format timestamp with timezone abbreviation for timezone verification
const formatTimestampWithTimezone = (timestamp) => {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
};

const renderDetailBlock = (label, value, monospace = false) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <div
      className={`mt-1 break-words text-sm text-gray-800 ${
        monospace ? "font-mono text-xs whitespace-pre-wrap" : ""
      }`}
    >
      {value ?? "N/A"}
    </div>
  </div>
);

const ActivityLogs = ({
  logs,
  loading,
  totalLogs = 0,
  onPageChange,
  onItemsPerPageChange,
  currentPage = 1,
  itemsPerPage = 10,
}) => {
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage);
  const [localItemsPerPage, setLocalItemsPerPage] = useState(itemsPerPage);
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    setLocalCurrentPage(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setLocalItemsPerPage(itemsPerPage);
  }, [itemsPerPage]);

  useEffect(() => {
    if (expandedLogId && !logs.some((log) => log._id === expandedLogId)) {
      setExpandedLogId(null);
    }
  }, [expandedLogId, logs]);

  const totalPages = Math.ceil(totalLogs / localItemsPerPage);
  const startItem = (localCurrentPage - 1) * localItemsPerPage + 1;
  const endItem = Math.min(localCurrentPage * localItemsPerPage, totalLogs);

  const handlePageChange = (page) => {
    setLocalCurrentPage(page);
    if (onPageChange) onPageChange(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setLocalItemsPerPage(newItemsPerPage);
    setLocalCurrentPage(1);
    if (onItemsPerPageChange) onItemsPerPageChange(newItemsPerPage);
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="border-b border-gray-200 px-6 py-5">
        <h3 className="text-lg font-medium text-gray-900">Activity Logs</h3>
        <p className="mt-1 text-sm text-gray-500">
          Expanded entries include request source, endpoint, target, and client
          details for investigation.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Action
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Category
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Request
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Description
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Details
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <div className="flex justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Loading activity logs...
                  </p>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center">
                  <IconEye className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    No activity logs found
                  </p>
                  <p className="text-xs text-gray-400">
                    Activity logs will appear here as users interact with the
                    system
                  </p>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const metadata = log.metadata || {};
                const network = metadata.network || {};
                const client = metadata.client || {};
                const requestBody = metadata.requestBody || {};
                const security = metadata.security || {};
                const isExpanded = expandedLogId === log._id;
                const responseSummary = [
                  metadata.statusCode ? `HTTP ${metadata.statusCode}` : null,
                  metadata.responseTimeMs !== null &&
                  metadata.responseTimeMs !== undefined
                    ? `${metadata.responseTimeMs} ms`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" / ");

                return (
                  <React.Fragment key={log._id}>
                    <tr className="align-top hover:bg-gray-50">
                      <td className="px-6 py-6">
                        <div className="text-sm font-semibold text-gray-900">
                          {log.action}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {log.targetType
                            ? `${log.targetType}: ${log.targetIdentifier || "N/A"}`
                            : "System: System Operation"}
                        </div>
                      </td>

                      <td className="px-6 py-6 whitespace-nowrap">
                        <span
                          className={`rounded-md px-3 py-1 text-xs ${
                            categoryColors[log.category] ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {log.category}
                        </span>
                      </td>

                      <td className="px-6 py-6 whitespace-nowrap">
                        {log.success ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <IconCheck className="h-5 w-5" />
                            <span className="text-sm font-medium">SUCCESS</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <IconX className="h-5 w-5" />
                            <span className="text-sm font-medium">FAILED</span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-6 text-sm text-gray-900">
                        <div className="font-mono text-xs break-all">
                          {(metadata.method || "N/A").toUpperCase()}{" "}
                          {truncateText(metadata.url || "N/A", 40)}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          IP: {network.clientIp || log.ipAddress || "N/A"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {responseSummary || "No response details"}
                        </div>
                      </td>

                      <td
                        className="px-6 py-6 text-sm text-gray-900"
                        title={log.description}
                      >
                        <div className="max-w-md break-words">
                          {truncateText(log.description, 180)}
                        </div>
                        {log.errorMessage && (
                          <div className="mt-2 text-xs text-red-600">
                            Error: {truncateText(log.errorMessage, 120)}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-6 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedLogId(isExpanded ? null : log._id)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          {isExpanded ? (
                            <>
                              <IconChevronUp size={16} />
                              Hide
                            </>
                          ) : (
                            <>
                              <IconChevronDown size={16} />
                              View
                            </>
                          )}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan="6" className="px-6 py-5">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {renderDetailBlock(
                              "Timestamp",
                              formatTimestampWithTimezone(
                                metadata.timestamp || log.timestamp,
                              ),
                            )}
                            {renderDetailBlock(
                              "Request ID",
                              metadata.requestId,
                              true,
                            )}
                            {renderDetailBlock(
                              "Actor",
                              log.userEmail ||
                                metadata.actor?.attemptedEmail ||
                                log.adminEmail ||
                                "Unknown",
                            )}
                            {renderDetailBlock(
                              "Endpoint",
                              `${metadata.method || "N/A"} ${
                                metadata.url || "N/A"
                              }`,
                              true,
                            )}
                            {renderDetailBlock(
                              "Target",
                              log.targetType
                                ? `${log.targetType}: ${
                                    log.targetIdentifier || "Unknown"
                                  }`
                                : "No target captured",
                            )}
                            {renderDetailBlock(
                              "Response",
                              responseSummary || "No response details",
                            )}
                            {renderDetailBlock(
                              "Client IP",
                              network.clientIp || log.ipAddress || "N/A",
                              true,
                            )}
                            {renderDetailBlock(
                              "Forwarded Chain",
                              network.forwardedFor?.length
                                ? network.forwardedFor.join(", ")
                                : "N/A",
                              true,
                            )}
                            {renderDetailBlock(
                              "User Agent",
                              client.userAgent || log.userAgent || "N/A",
                              true,
                            )}
                            {renderDetailBlock("Origin", network.origin, true)}
                            {renderDetailBlock(
                              "Referer",
                              network.referer,
                              true,
                            )}
                            {renderDetailBlock(
                              "Security Flags",
                              security.riskFlags?.length
                                ? security.riskFlags.join(", ")
                                : "None",
                            )}
                            {renderDetailBlock(
                              "Request Payload",
                              formatJsonPreview(requestBody.preview),
                              true,
                            )}
                            {renderDetailBlock(
                              "Captured Keys",
                              requestBody.keys?.length
                                ? requestBody.keys.join(", ")
                                : "N/A",
                              true,
                            )}
                            {log.errorMessage &&
                              renderDetailBlock(
                                "Failure Reason",
                                log.errorMessage,
                                true,
                              )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && logs.length > 0 && totalLogs > 0 && (
        <div className="flex flex-col gap-4 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show</span>
            <select
              value={localItemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700">entries</span>
          </div>

          <div className="text-center text-sm text-gray-700">
            Showing {startItem} to {endItem} of {totalLogs} entries
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(localCurrentPage - 1)}
              disabled={localCurrentPage === 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (localCurrentPage <= 3) {
                  pageNum = i + 1;
                } else if (localCurrentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = localCurrentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`rounded-md px-3 py-1 text-sm ${
                      localCurrentPage === pageNum
                        ? "bg-blue-500 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(localCurrentPage + 1)}
              disabled={localCurrentPage === totalPages}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;
