import PropTypes from "prop-types";
import { FcGoogle } from "react-icons/fc";

export default function GoogleLoginButton({ onClick, disabled = false }) {
  return (
    <button
      className={`w-full flex items-center justify-center gap-3 px-4 sm:px-6 py-3 border border-gray-300 font-medium rounded-lg text-sm sm:text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-4 sm:mb-6 ${
        disabled 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <FcGoogle size={20} className={`sm:w-6 sm:h-6 ${disabled ? 'opacity-50' : ''}`} />
      <span className="text-sm sm:text-base">
        {disabled ? 'Complete reCAPTCHA first' : 'Sign in with Google'}
      </span>
    </button>
  );
}

GoogleLoginButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
