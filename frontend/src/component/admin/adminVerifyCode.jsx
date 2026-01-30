import { useState } from "react";
import { useNavigate } from "react-router-dom";
import adminAuth from "../../utils/adminAuth";
import {
  AuthLayout,
  FormHeader,
  FormInput,
  SubmitButton,
  FeedbackMessage,
} from "./ui/Code-Password";

export default function AdminVerifyCode() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const passcode = event.target.passcode.value.trim();
    if (!passcode) {
      setError("Please enter the code sent to your email.");
      return;
    }

    try {
      setLoading(true);
      const data = await adminAuth.verifyResetCode(passcode);

      if (data.ok || data.success) {
        sessionStorage.setItem("admin_reset_passcode", passcode);
        setSuccess("Code verified successfully!");
        event.target.reset();
        navigate("/admin/reset-password");
      } else {
        setError(data.message || "Invalid or expired code.");
      }
    } catch (verifyError) {
      console.error("Verification error:", verifyError);
      setError(verifyError.message || "Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout onBack={() => navigate("/admin/admin-request-code")}>
      <FormHeader
        title="Verify Code"
        subtitle="Enter the 6-digit code sent to your email"
      />

      <form onSubmit={handleVerifyCode} className="space-y-5">
        <FormInput
          label="Verification Code:"
          type="text"
          name="passcode"
          id="passcode"
          required
          maxLength={6}
          placeholder="Enter code"
          className="tracking-widest text-center"
        />

        <SubmitButton loading={loading} loadingText="Verifying...">
          Verify Code
        </SubmitButton>
      </form>

      <FeedbackMessage success={success} error={error} />
    </AuthLayout>
  );
}
