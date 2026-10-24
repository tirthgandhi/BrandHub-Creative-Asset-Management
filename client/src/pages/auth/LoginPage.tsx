import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, Input } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { AuthLayout } from "./AuthLayout";

export function LoginPage() {
  const { user, login, error, clearError } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [show, setShow] = useState(false); const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate(); const location = useLocation();
  if (user) return <Navigate to={user.mustChangePassword ? "/change-password" : "/app/dashboard"} replace />;
  const submit = async (event: FormEvent) => { event.preventDefault(); clearError(); setSubmitting(true); try { const result = await login(email, password); navigate(result.mustChangePassword ? "/change-password" : (location.state as { from?: string } | null)?.from || "/app/dashboard", { replace: true }); } catch { /* rendered from context */ } finally { setSubmitting(false); } };
  return <AuthLayout eyebrow="Welcome back" title="Log in to BrandHub" intro="Use the account supplied by your agency, or the Client account you created." footer={<p>New client? <Link to="/register">Create an account</Link></p>}><form className="auth-form" onSubmit={submit}>{error ? <Alert>{error.message}</Alert> : null}<label>Email<Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<span className="password-input"><Input type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((value) => !value)}>{show ? <EyeOff /> : <Eye />}</button></span></label><Button type="submit" loading={submitting}>Log in</Button></form></AuthLayout>;
}
