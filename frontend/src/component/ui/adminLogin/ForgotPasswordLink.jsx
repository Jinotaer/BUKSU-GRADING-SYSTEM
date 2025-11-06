import PropTypes from "prop-types";

export default function ForgotPasswordLink({ onClick }) {
  return (
    <div className="flex justify-end">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
        className="mt-2 text-sm text-blue-600 hover:underline cursor-pointer"
      >
        Forgot password?
      </a>
    </div>
  );
}

ForgotPasswordLink.propTypes = {
  onClick: PropTypes.func.isRequired,
};
