import PropTypes from "prop-types";

export default function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-8 left-8 text-gray-600 hover:text-gray-800 transition-colors"
      aria-label="Go back"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19l-7-7 7-7"
        />
      </svg>
    </button>
  );
}

BackButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};
