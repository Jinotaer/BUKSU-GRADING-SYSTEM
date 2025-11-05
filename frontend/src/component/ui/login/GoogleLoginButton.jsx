import PropTypes from "prop-types";
import { FcGoogle } from "react-icons/fc";

export default function GoogleLoginButton({ onClick }) {
  return (
    <button
      className="w-full flex items-center justify-center gap-3 px-4 sm:px-6 py-3 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg text-sm sm:text-base hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-4 sm:mb-6"
      onClick={onClick}
    >
      <FcGoogle size={20} className="sm:w-6 sm:h-6" />
      <span className="text-sm sm:text-base">Sign in with Google</span>
    </button>
  );
}

GoogleLoginButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};
