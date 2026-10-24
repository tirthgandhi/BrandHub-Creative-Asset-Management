import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Alert, Button, Input } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { AuthLayout } from "./AuthLayout";

export function ChangePasswordPage() {
  const { user, loading, changePassword, logout, error, clearError } = useAuth(); const navigate = useNavigate();
  const [currentPassword, setCurrent] = useState(""); const [newPassword, setNew] = useState(""); const [confirm, setConfirm] = useState(""); const [localError, setLocalError] = useState(""); const [submitting, setSubmitting] = useState(false);
  if (!loading && !user) return <Navigate to="/login" replace />;
  const submit = async (event: FormEvent) => { event.preventDefault(); clearError(); setLocalError(""); if (newPassword !== confirm) return setLocalError("New passwords do not match"); setSubmitting(true); try { await changePassword(currentPassword, newPassword); navigate("/app/dashboard", { replace: true }); } catch { /* context error */ } finally { setSubmitting(false); } };
  return <AuthLayout eyebrow="Security required" title="Choose a new password" intro="Your Admin supplied the initial password. Change it before opening the workspace." footer={<Button variant="ghost" onClick={logout}>Sign out</Button>}><form className="auth-form" onSubmit={submit}>{localError || error ? <Alert>{localError || error?.message}</Alert> : null}<label>Current password<Input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrent(event.target.value)} required /></label><label>New password<Input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNew(event.target.value)} required /></label><label>Confirm new password<Input type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></label><Button type="submit" loading={submitting}>Change password</Button></form></AuthLayout>;
}
