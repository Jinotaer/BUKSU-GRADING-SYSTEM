import PropTypes from "prop-types";

export default function BrandPanel({ logoSrc, backgroundSrc, title }) {
  return (
    <div
      className="flex-1 relative flex flex-col p-6 sm:p-8 lg:p-12 bg-cover bg-right bg-no-repeat overflow-hidden min-h-[40vh] lg:min-h-screen "
      style={{ backgroundImage: `url(${backgroundSrc})` }}
    >
      {/* Logo and Title at the top */}
      <div className="relative z-10 flex flex-col items-center text-center pt-4 sm:pt-6 lg:pt-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <img
            src={logoSrc}
            alt="BUKSU Logo"
            className="h-16 w-16 sm:h-20 sm:w-20 lg:h-28 lg:w-28 rounded object-cover mx-auto"
          />
        </div>
        <h1 className="text-white font-extrabold leading-tight text-2xl sm:text-3xl lg:text-5xl tracking-wider uppercase text-shadow-lg font-sans">
          {title}
        </h1>
      </div>
    </div>
  );
}

BrandPanel.propTypes = {
  logoSrc: PropTypes.string.isRequired,
  backgroundSrc: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};
