import PropTypes from "prop-types";

export default function LoginWelcomeHeader({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        {title}
      </h2>
      <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
        {subtitle}
      </p>
    </div>
  );
}

LoginWelcomeHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
};
