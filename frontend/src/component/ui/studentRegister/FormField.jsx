import PropTypes from "prop-types";

export default function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  readOnly = false,
  icon,
  helperText,
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
      </label>
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        readOnly={readOnly}
        className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-all text-sm ${
          readOnly
            ? "bg-gray-50 text-gray-600"
            : "focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        }`}
      />
      {helperText && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {helperText}
        </p>
      )}
    </div>
  );
}

FormField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  icon: PropTypes.node,
  helperText: PropTypes.string,
};
