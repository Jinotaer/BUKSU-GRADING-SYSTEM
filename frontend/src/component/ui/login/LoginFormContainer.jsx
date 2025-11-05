import PropTypes from "prop-types";

export default function LoginFormContainer({ children }) {
  return (
    <div className="w-full lg:w-[500px] xl:w-[480px] flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-12 lg:px-16 lg:py-12 bg-gray-50">
      <div className="w-full max-w-sm mx-auto">{children}</div>
    </div>
  );
}

LoginFormContainer.propTypes = {
  children: PropTypes.node.isRequired,
};
