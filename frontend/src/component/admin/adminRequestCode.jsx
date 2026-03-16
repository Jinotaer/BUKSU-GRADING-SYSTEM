import { useNavigate } from "react-router-dom";
import { useState } from "react";
import adminAuth from "../../utils/adminAuth";
import {
  AuthLayout,
  FormHeader,
  FormInput,
  SubmitButton,
  FeedbackMessage,
} from "./ui/Code-Password";

export default function AdminRequestCode() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const email = e.target.adminEmail.value;

    try {
      setLoading(true);
      const data = await adminAuth.requestResetCode(email);

      sessionStorage.removeItem("admin_reset_passcode");
      sessionStorage.removeItem("admin_reset_request_id");

      if (data.ok) {
        setSuccess(data.message || "Reset code sent to your admin email.");
        if (data.canProceed && data.resetRequestId) {
          sessionStorage.setItem("admin_reset_request_id", data.resetRequestId);
        }
        e.target.reset();
        navigate("/admin/admin-verify-code");
      } else {
        setError(data.message || "Failed to send reset code.");
      }
    } catch (error) {
      console.error("Request code error:", error);
      setError(error.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout onBack={() => navigate("/admin/admin-login")}>
      <FormHeader
        title="Request Reset Code"
        subtitle="Enter your admin email to receive a reset code"
      />

      <form onSubmit={handleRequestCode} className="space-y-5">
        <FormInput
          label="Email:"
          type="email"
          name="adminEmail"
          id="adminEmail"
          required
        />

        <SubmitButton loading={loading} loadingText="Sending...">
          Request Code
        </SubmitButton>
      </form>

      <FeedbackMessage success={success} error={error} />
    </AuthLayout>
  );
}
