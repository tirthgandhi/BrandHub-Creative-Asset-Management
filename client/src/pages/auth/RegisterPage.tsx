import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Alert, Button, Input } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { AuthLayout } from "./AuthLayout";

export function RegisterPage() {
  const { user, register, error, clearError } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" }); const [localError, setLocalError] = useState(""); const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to="/app/dashboard" replace />;
  const field = (name: keyof typeof form) => ({ value: form[name], onChange: (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [name]: event.target.value })) });
  const submit = async (event: FormEvent) => { event.preventDefault(); clearError(); setLocalError(""); if (form.password !== form.confirm) return setLocalError("Passwords do not match"); if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(form.password)) return setLocalError("Use 8–72 characters with at least one letter and one number"); setSubmitting(true); try { await register(form.name, form.email, form.password); navigate("/app/dashboard", { replace: true }); } catch { /* context error */ } finally { setSubmitting(false); } };
  return <AuthLayout eyebrow="Client registration" title="Create your account" intro="Public registration always creates a Client account. Designer accounts are created by an agency Admin." footer={<p>Already have an account? <Link to="/login">Log in</Link></p>}><form className="auth-form" onSubmit={submit}>{localError || error ? <Alert>{localError || error?.message}</Alert> : null}<label>Full name<Input autoComplete="name" {...field("name")} required /></label><label>Email<Input type="email" autoComplete="email" {...field("email")} required /></label><label>Password<Input type="password" autoComplete="new-password" {...field("password")} required /><span className="field-hint">At least 8 characters with a letter and number.</span></label><label>Confirm password<Input type="password" autoComplete="new-password" {...field("confirm")} required /></label><Button type="submit" loading={submitting}>Create Client account</Button></form></AuthLayout>;
}
