import PropTypes from "prop-types";

export default function LoginForm({ onSubmit, disabled = false }) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="adminEmail"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Email:
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          disabled={disabled}
          className={`w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>

      <div>
        <label
          htmlFor="adminPassword"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Password:
        </label>
        <input
          type="password"
          name="adminPassword"
          id="adminPassword"
          required
          disabled={disabled}
          className={`w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>

      <button
        type="submit"
        disabled={disabled}
        className={`w-full px-4 py-3 text-white font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 ${
          disabled 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-900 hover:bg-blue-800'
        }`}
        style={disabled ? {} : { backgroundColor: "#091057" }}
      >
        {disabled ? 'Complete reCAPTCHA first' : 'Sign In'}
      </button>
    </form>
  );
}

