import { Link, useLocation } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { GlassButton, PasswordInput } from "../../components/auth/AuthControls";

export function ResetPasswordPage() {
  const token = new URLSearchParams(useLocation().search).get("token");
  return (
    <AuthLayout
      eyebrow="ACCOUNT ACCESS"
      title={token ? "Create a new password" : "Reset link unavailable"}
      subtitle={token ? "Password recovery is not configured yet." : "Request a new link once password recovery is available."}
    >
      <div className="sky-auth-form">
        <p className="sky-auth-service-notice" role="status">
          {token
            ? "This link cannot be verified or used until secure password recovery is enabled. Your password has not changed."
            : "There is no reset token in this link. Your password has not changed."}
        </p>
        <fieldset disabled className="sky-auth-disabled-fieldset">
          <div className="sky-auth-field">
            <label className="sky-auth-label" htmlFor="reset-password">New password</label>
            <PasswordInput id="reset-password" autoComplete="new-password" placeholder="New password" disabled />
          </div>
          <div className="sky-auth-field">
            <label className="sky-auth-label" htmlFor="reset-confirm">Confirm new password</label>
            <PasswordInput id="reset-confirm" autoComplete="new-password" placeholder="Confirm password" disabled />
          </div>
        </fieldset>
        <GlassButton type="button" fullWidth disabled>Update password</GlassButton>
        <p className="sky-auth-footer-text"><Link to="/login" className="sky-auth-link">← Back to sign in</Link></p>
      </div>
    </AuthLayout>
  );
}
