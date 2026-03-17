import ReCAPTCHA from "react-google-recaptcha";
import PropTypes from "prop-types";

export default function CaptchaSection({
  sitekey,
  onChange,
  onExpired,
  onErrored,
  alignment = "center",
  className = "",
}) {
  const justifyClass = alignment === "start" ? "justify-start" : "justify-center";

  return (
    <div className={`w-full overflow-x-auto ${className}`.trim()}>
      <div className={`flex min-w-[304px] ${justifyClass}`}>
        <ReCAPTCHA
          sitekey={sitekey}
          onChange={onChange}
          onExpired={onExpired}
          onErrored={onErrored}
          size="normal"
          theme="light"
        />
      </div>
    </div>
  );
}

CaptchaSection.propTypes = {
  sitekey: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onExpired: PropTypes.func.isRequired,
  onErrored: PropTypes.func.isRequired,
  alignment: PropTypes.oneOf(["center", "start"]),
  className: PropTypes.string,
};
