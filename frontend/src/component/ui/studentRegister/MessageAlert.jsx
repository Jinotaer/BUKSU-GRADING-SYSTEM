import PropTypes from "prop-types";

export default function MessageAlert({ message, type = "error" }) {
  if (!message) return null;

  const isError = type === "error";
  const bgColor = isError ? "bg-red-50" : "bg-green-50";
  const borderColor = isError ? "border-red-500" : "border-green-500";
  const textColor = isError ? "text-red-700" : "text-green-700";
  const iconColor = isError ? "text-red-500" : "text-green-500";

  return (
    <div className={`p-4 ${bgColor} border-l-4 ${borderColor} rounded-lg`}>
      <div className="flex items-center gap-3">
        <svg
          className={`w-5 h-5 ${iconColor} flex-shrink-0`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          {isError ? (
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          ) : (
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          )}
        </svg>
        <p className={`${textColor} text-sm font-medium`}>{message}</p>
      </div>
    </div>
  );
}

MessageAlert.propTypes = {
  message: PropTypes.string,
  type: PropTypes.oneOf(["error", "success"]),
};
