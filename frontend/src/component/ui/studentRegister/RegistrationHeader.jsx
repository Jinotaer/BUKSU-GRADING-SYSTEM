import PropTypes from "prop-types";

export default function RegistrationHeader({ logoSrc, title, subtitle, loginLink }) {
  return (
    <div className="text-center lg:text-left">
      <div className="inline-block relative">
        <div className="absolute inset-0 bg-blue-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
        <img 
          src={logoSrc} 
          alt="BUKSU Logo" 
          className="relative block mx-auto lg:mx-0 mb-6 w-32 h-32 rounded-full object-cover shadow-2xl ring-4 ring-white"
        />
      </div>
      <h1 className="font-outfit font-bold text-gray-900 text-4xl mb-2">
        {title}
      </h1>
      <p className="text-gray-600 text-lg">{subtitle}</p>
      {loginLink && (
        <p className="text-gray-600 text-sm pt-5">
          Already registered?{" "}
          <a href={loginLink} className="text-blue-500 hover:underline">
            Login
          </a>
        </p>
      )}
    </div>
  );
}

RegistrationHeader.propTypes = {
  logoSrc: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  loginLink: PropTypes.string,
};
