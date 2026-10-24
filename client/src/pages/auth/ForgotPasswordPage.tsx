import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { GlassButton, GlassInput } from "../../components/auth/AuthControls";

export function ForgotPasswordPage() {
  return (
    <AuthLayout
      eyebrow="ACCOUNT ACCESS"
      title="Forgot your password?"
      subtitle="Password recovery will be available when email delivery is configured."
    >
      <div className="sky-auth-form">
        <p className="sky-auth-service-notice" role="status">
          We cannot send reset links yet. No email will be sent from this page.
        </p>
        <div className="sky-auth-field">
          <label className="sky-auth-label" htmlFor="forgot-email">Email address</label>
          <GlassInput id="forgot-email" type="email" placeholder="you@studio.com" icon={<Mail size={16} />} disabled />
        </div>
        <GlassButton type="button" fullWidth disabled>Send reset link</GlassButton>
        <p className="sky-auth-footer-text"><Link to="/login" className="sky-auth-link">← Back to sign in</Link></p>
      </div>
    </AuthLayout>
  );
}
