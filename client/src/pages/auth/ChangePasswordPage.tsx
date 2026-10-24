import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AuthLayout } from "./AuthLayout";
import {
  PasswordInput,
  PasswordStrength,
  GlassButton,
  FormError,
} from "../../components/auth/AuthControls";

export function ChangePasswordPage() {
  const { user, loading, changePassword, logout, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && !user) return <Navigate to="/login" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError("");
    if (!current) return setLocalError("Current password is required.");
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(newPw))
      return setLocalError("New password must be 8–72 characters with at least one letter and one number.");
    if (newPw !== confirm) return setLocalError("New passwords do not match.");
    setSubmitting(true);
    try {
      await changePassword(current, newPw);
      navigate("/app/dashboard", { replace: true });
    } catch {
      /* context error */
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error?.message;

  return (
    <AuthLayout
      eyebrow="Security required"
      title="Choose a new password"
      subtitle="Your admin supplied the initial password. Change it before opening the workspace."
      showHomeLink={false}
    >
      <form className="sky-auth-form" onSubmit={submit} noValidate>
        <FormError message={displayError} />

        <div className="sky-auth-field">
          <label className="sky-auth-label" htmlFor="cp-current">Current password</label>
          <PasswordInput
            id="cp-current"
            autoComplete="current-password"
            placeholder="Your current password"
            value={current}
            onChange={(e) => { setCurrent(e.target.value); setLocalError(""); clearError(); }}
            required
          />
        </div>

        <div className="sky-auth-field">
          <label className="sky-auth-label" htmlFor="cp-new">New password</label>
          <PasswordInput
            id="cp-new"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={newPw}
            onChange={(e) => { setNewPw(e.target.value); setLocalError(""); clearError(); }}
            required
          />
          <PasswordStrength password={newPw} />
        </div>

        <div className="sky-auth-field">
          <label className="sky-auth-label" htmlFor="cp-confirm">Confirm new password</label>
          <PasswordInput
            id="cp-confirm"
            autoComplete="new-password"
            placeholder="Repeat new password"
            value={confirm}
            onChange={(e) => { setConfirm(e.target.value); setLocalError(""); clearError(); }}
            invalid={!!(confirm && confirm !== newPw)}
            required
          />
        </div>

        <GlassButton type="submit" loading={submitting} fullWidth>
          Change password
        </GlassButton>

        <GlassButton type="button" variant="ghost" fullWidth onClick={logout}>
          Sign out instead
        </GlassButton>
      </form>
    </AuthLayout>
  );
}
