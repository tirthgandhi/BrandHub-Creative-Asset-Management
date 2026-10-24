import { Link } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { GlassButton, OTPInput } from "../../components/auth/AuthControls";

export function VerifyEmailPage() {
  return (
    <AuthLayout
      eyebrow="ACCOUNT SECURITY"
      title="Verify your email"
      subtitle="Email verification is not required for current BrandHub accounts."
    >
      <div className="sky-auth-form">
        <p className="sky-auth-service-notice" role="status">
          Verification email and code delivery are not configured. We will enable this step when the server can issue and validate codes securely.
        </p>
        <fieldset disabled className="sky-auth-disabled-fieldset">
          <div className="sky-auth-field sky-auth-field--centered">
            <span className="sky-auth-label sky-auth-label--center">Six-digit verification code</span>
            <OTPInput value="" onChange={() => {}} />
          </div>
        </fieldset>
        <GlassButton type="button" fullWidth disabled>Verify code</GlassButton>
        <p className="sky-auth-footer-text"><Link to="/login" className="sky-auth-link">Back to sign in</Link></p>
      </div>
    </AuthLayout>
  );
}
