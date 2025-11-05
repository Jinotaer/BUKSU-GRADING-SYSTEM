import { Link } from "react-router-dom";
import PropTypes from "prop-types";

export default function AdminLoginLink({ to }) {
  return (
    <Link
      to={to}
      className="w-full block text-center px-4 sm:px-6 py-3 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 no-underline text-sm sm:text-base"
      style={{ backgroundColor: "#091057" }}
    >
      Login as Admin
    </Link>
  );
}

AdminLoginLink.propTypes = {
  to: PropTypes.string.isRequired,
};
