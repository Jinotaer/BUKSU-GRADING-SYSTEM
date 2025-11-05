import PropTypes from "prop-types";

export default function AdminLoginForm({ onSubmit }) {
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
          name="adminEmail"
          id="adminEmail"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
      </div>

      <button
        type="submit"
        className="w-full px-4 py-3 bg-blue-900 text-white font-semibold rounded-md hover:bg-blue-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2"
        style={{ backgroundColor: "#091057" }}
      >
        Login
      </button>
    </form>
  );
}

AdminLoginForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};
