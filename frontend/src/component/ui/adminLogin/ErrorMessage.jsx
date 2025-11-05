import PropTypes from "prop-types";

export default function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div>
      <p className="text-red-600 text-sm text-center">{message}</p>
    </div>
  );
}

ErrorMessage.propTypes = {
  message: PropTypes.string,
};
