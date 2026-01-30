import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import adminAuth from "../../utils/adminAuth";
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
  const [passcode, setPasscode] = useState(() =>
    sessionStorage.getItem("admin_reset_passcode") || ""
  );

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

    const newPassword = event.target.newPassword.value;
    const confirmPassword = event.target.confirmPassword.value;
    const storedPasscode = sessionStorage.getItem("admin_reset_passcode");

    if (!storedPasscode) {
      setError("Reset code not found. Please request a new one.");
      setPasscode("");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await adminAuth.resetPassword(storedPasscode, newPassword);

      if (response.success || response.ok) {
        setSuccess("Password successfully updated!");
        sessionStorage.removeItem("admin_reset_passcode");
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
        />

        <FormInput
          label="Confirm New Password:"
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          required
        />

        <SubmitButton loading={loading} loadingText="Updating...">
          Update Password
        </SubmitButton>
      </form>

      <FeedbackMessage success={success} error={error} />
    </AuthLayout>
  );
}
