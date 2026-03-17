import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import adminAuth from "../../utils/adminAuth";
import {
  ADMIN_PASSWORD_REQUIREMENTS_TEXT,
  getAdminPasswordValidationErrors,
  getAdminPasswordValidationMessage,
} from "../../utils/adminPasswordValidation";
import {
  AuthLayout,
  FormHeader,
  FormInput,
  SubmitButton,
  FeedbackMessage,
} from "./ui/Code-Password";

export default function AdminResetPassword() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passcode, setPasscode] = useState(() =>
    sessionStorage.getItem("admin_reset_passcode") || ""
  );

  const passwordValidationErrors = getAdminPasswordValidationErrors(newPassword);
  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;
  const canSubmit =
    passcode &&
    newPassword &&
    confirmPassword &&
    passwordsMatch &&
    passwordValidationErrors.length === 0;

  useEffect(() => {
    if (!passcode) {
      setError("Reset code expired. Please request a new one.");
      const redirect = setTimeout(() => navigate("/admin/admin-request-code"), 3000);
      return () => clearTimeout(redirect);
    }
    return undefined;
  }, [passcode, navigate]);

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const storedPasscode = sessionStorage.getItem("admin_reset_passcode");
    const resetRequestId = sessionStorage.getItem("admin_reset_request_id");

    if (!storedPasscode || !resetRequestId) {
      setError("Reset code not found. Please request a new one.");
      setPasscode("");
      return;
    }

    const passwordValidationMessage =
      getAdminPasswordValidationMessage(newPassword);
    if (passwordValidationMessage) {
      setError(passwordValidationMessage);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await adminAuth.resetPassword(
        storedPasscode,
        newPassword,
        resetRequestId
      );

      if (response.success || response.ok) {
        setSuccess("Password successfully updated!");
        sessionStorage.removeItem("admin_reset_passcode");
        sessionStorage.removeItem("admin_reset_request_id");
        setNewPassword("");
        setConfirmPassword("");
        event.target.reset();
        navigate("/admin/admin-login");
      } else {
        setError(response.message || "Failed to reset password.");
      }
    } catch (resetError) {
      console.error("Reset password error:", resetError);
      setError(resetError.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout onBack={() => navigate("/admin/admin-login")}>
      <FormHeader
        title="Reset Password"
        subtitle="Set a new password for your administrator account"
      />

      <form onSubmit={handleResetPassword} className="space-y-5">
        <FormInput
          label="New Password:"
          type="password"
          name="newPassword"
          id="newPassword"
          required
          minLength={8}
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />

        <FormInput
          label="Confirm New Password:"
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        <div className="space-y-2 text-sm text-gray-600">
          <p>{ADMIN_PASSWORD_REQUIREMENTS_TEXT}</p>
          {newPassword && passwordValidationErrors.length > 0 && (
            <ul className="space-y-1 text-red-600">
              {passwordValidationErrors.map((validationError) => (
                <li key={validationError}>{validationError}</li>
              ))}
            </ul>
          )}
          {!passwordsMatch && (
            <p className="text-red-600">New passwords do not match.</p>
          )}
        </div>

        <SubmitButton
          loading={loading}
          loadingText="Updating..."
          disabled={!canSubmit}
        >
          Update Password
        </SubmitButton>
      </form>

      <FeedbackMessage success={success} error={error} />
    </AuthLayout>
  );
}
