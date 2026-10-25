import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { loginDestination, roleLabels } from "../../config/access";
import type { AppRole } from "../../types/auth";
import { Mail, ShieldCheck, Paintbrush, BriefcaseBusiness } from "lucide-react";
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
  const [role, setRole] = useState<AppRole>("client");
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
      : loginDestination((location.state as { from?: string } | null)?.from, user.role);
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
      const result = await login(email, password, role);
      const dest = result.mustChangePassword
        ? "/change-password"
        : loginDestination((location.state as { from?: string } | null)?.from, result.role);
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
      subtitle="One workspace. Choose your role to continue."
    >
      <form className="sky-auth-form" onSubmit={submit} noValidate>
        <FormError message={displayError} />
        <div className="login-role-picker" role="group" aria-label="Sign-in role">
          {(["client", "designer", "project_manager", "super_admin"] as AppRole[]).map(value => { const Icon = ["project_manager", "super_admin"].includes(value) ? ShieldCheck : value === "designer" ? Paintbrush : BriefcaseBusiness; return <button type="button" key={value} className={`login-role ${role === value ? "is-selected" : ""}`} aria-pressed={role === value} onClick={() => { setRole(value); setEmail(""); setPassword(""); setLocalError(""); clearError(); }}><Icon size={20} aria-hidden="true" /><span>{roleLabels[value]}</span></button>; })}
        </div>
        <div className="login-role-description"><span className="login-role-dot" />{role === "super_admin" ? "Manage privileged accounts and oversee the entire workspace." : role === "client" ? "Request projects, review designs, and approve your next campaign." : role === "designer" ? "Create for your assigned projects and respond to client feedback." : "Manage your team, assign projects, and oversee every review."}</div>

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
          Sign in as {roleLabels[role]}
        </GlassButton>

        <p className="sky-auth-footer-text">
          Don't have an account?{" "}
          <Link to="/signup" className="sky-auth-link">Create account</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
