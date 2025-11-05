import ReCAPTCHA from "react-google-recaptcha";
import PropTypes from "prop-types";

export default function CaptchaSection({
  sitekey,
  onChange,
  onExpired,
  onErrored,
}) {
  return (
    <div className="flex justify-center mt-4 sm:mt-6 mb-4 sm:mb-6">
      <div className="w-full max-w-xs flex justify-center">
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
};
