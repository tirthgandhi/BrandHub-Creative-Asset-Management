import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Mail, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { AuthLayout } from "./AuthLayout";
import {
  GlassInput,
  PasswordInput,
  PasswordStrength,
  GlassButton,
  FormError,
} from "../../components/auth/AuthControls";

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

export function RegisterPage() {
  const { user, register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/app/dashboard" replace />;

  const field =
    <K extends keyof typeof form>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setLocalError("");
      clearError();
    };

  const validate = () => {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address.";
    if (!PASSWORD_REGEX.test(form.password))
      return "Password must be 8–72 characters with at least one letter and one number.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return null;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    const err = validate();
    if (err) return setLocalError(err);
    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate("/app/dashboard", { replace: true });
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
      title="Create your space"
      subtitle="Create a Client account for your creative projects. Designer accounts are created by an Admin."
    >
      <form className="sky-auth-form" onSubmit={submit} noValidate>
        <FormError message={displayError} />

        <div className="sky-auth-field">
          <label className="sky-auth-label" htmlFor="reg-name">Full name</label>
          <GlassInput
            id="reg-name"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            value={form.name}
            onChange={field("name")}
            icon={<User size={16} />}
            required
          />
        </div>

        <div className="sky-auth-field">
          <label className="sky-auth-label" htmlFor="reg-email">Email</label>
          <GlassInput
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="you@studio.com"
            value={form.email}
            onChange={field("email")}
            icon={<Mail size={16} />}
            required
          />
        </div>

        <div className="sky-auth-field">
          <label className="sky-auth-label" htmlFor="reg-password">Password</label>
          <PasswordInput
            id="reg-password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={field("password")}
            required
          />
          <PasswordStrength password={form.password} />
          <span className="sky-auth-hint">
            8–72 characters, at least one letter and one number.
          </span>
        </div>

        <div className="sky-auth-field">
          <label className="sky-auth-label" htmlFor="reg-confirm">Confirm password</label>
          <PasswordInput
            id="reg-confirm"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={form.confirm}
            onChange={field("confirm")}
            invalid={!!(form.confirm && form.confirm !== form.password)}
            required
          />
          {form.confirm && form.confirm !== form.password && (
            <span className="sky-auth-hint sky-auth-hint--error">Passwords don't match.</span>
          )}
        </div>

        <GlassButton type="submit" loading={submitting} fullWidth>
          Create account
        </GlassButton>

        <p className="sky-auth-footer-text">
          Already have an account?{" "}
          <Link to="/login" className="sky-auth-link">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
