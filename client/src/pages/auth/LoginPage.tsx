import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { AuthLayout } from "./AuthLayout";
import {
  GlassInput,
  PasswordInput,
  GlassButton,
  FormError,
} from "../../components/auth/AuthControls";

export function LoginPage() {
  const { user, login, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Already logged in → redirect
  if (user) {
    const dest = user.mustChangePassword
      ? "/change-password"
      : (location.state as { from?: string } | null)?.from || "/app/dashboard";
    return <Navigate to={dest} replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError("");

    // Basic client validation
    if (!email.trim()) return setLocalError("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setLocalError("Enter a valid email address.");
    if (!password) return setLocalError("Password is required.");

    setSubmitting(true);
    try {
      const result = await login(email, password);
      const dest = result.mustChangePassword
        ? "/change-password"
        : (location.state as { from?: string } | null)?.from || "/app/dashboard";
      navigate(dest, { replace: true });
    } catch {
      /* error rendered from context */
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error?.message;

  return (
    <AuthLayout
      eyebrow="BRANDHUB"
      title="Welcome back"
      subtitle="Your creative world is waiting."
    >
      <form className="sky-auth-form" onSubmit={submit} noValidate>
        <FormError message={displayError} />

        <div className="sky-auth-field">
          <label className="sky-auth-label" htmlFor="login-email">Email</label>
          <GlassInput
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@studio.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setLocalError(""); clearError(); }}
            icon={<Mail size={16} />}
            invalid={!!displayError}
            required
          />
        </div>

        <div className="sky-auth-field">
          <div className="sky-auth-label-row">
            <label className="sky-auth-label" htmlFor="login-password">Password</label>
            <Link to="/forgot-password" className="sky-auth-link sky-auth-link--small">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setLocalError(""); clearError(); }}
            invalid={!!displayError}
            required
          />
        </div>

        <GlassButton type="submit" loading={submitting} fullWidth>
          Sign in
        </GlassButton>

        <p className="sky-auth-footer-text">
          Don't have an account?{" "}
          <Link to="/signup" className="sky-auth-link">Create account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
