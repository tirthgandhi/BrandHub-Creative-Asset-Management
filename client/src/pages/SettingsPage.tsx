import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, ThemeSelector } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { normalizeApiError } from "../services/api";

export function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem("brandhub:reduce-motion") === "true");
  const [error, setError] = useState("");
  const changeMotion = (enabled: boolean) => {
    setReducedMotion(enabled);
    localStorage.setItem("brandhub:reduce-motion", String(enabled));
    document.documentElement.dataset.reduceMotion = String(enabled);
  };
  const signOut = async () => { setError(""); try { await logout(); navigate("/login", { replace: true }); } catch (caught) { setError(normalizeApiError(caught).message); } };
  return <section><header className="page-heading"><p className="eyebrow">Preferences</p><h1>Settings</h1><p>Choose how BrandHub looks and moves for you.</p></header><div className="surface-card settings-card"><h2>Appearance</h2><ThemeSelector /><p className="field-hint">Auto follows your local time: Morning, Afternoon, Sunset, and Night.</p><label className="workspace-inline-check"><input type="checkbox" checked={reducedMotion} onChange={(event) => changeMotion(event.target.checked)} /> Reduce motion</label></div><div className="surface-card settings-card"><h2>Account</h2><div className="action-row"><Link className="ui-button ui-button--ghost" to="/app/profile">Edit profile</Link><Link className="ui-button ui-button--ghost" to="/change-password">Change password</Link><Button variant="secondary" onClick={() => void signOut()}>Log out</Button></div>{error ? <Alert>{error}</Alert> : null}</div></section>;
}
