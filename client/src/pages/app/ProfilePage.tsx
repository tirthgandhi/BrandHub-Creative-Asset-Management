import { useState, type FormEvent } from "react";
import { Alert, Button, Input, StatusChip } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { normalizeApiError } from "../../services/api";
import { updateUser } from "../../services/users";

export function ProfilePage() {
  const { user, updateUser: acceptUser } = useAuth();
  const [name, setName] = useState(user?.name || ""); const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || ""); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  if (!user) return null;
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(""); setMessage(""); try { const updated = await updateUser(user.id, { name, avatarUrl }); acceptUser(updated); setMessage("Profile updated."); } catch (caught) { setError(normalizeApiError(caught).message); } finally { setSaving(false); } };
  return <section><header className="page-heading"><p className="eyebrow">ACCOUNT</p><h1>Your profile</h1><p>Update the details you are allowed to manage.</p></header><div className="profile-layout"><aside className="surface-card profile-summary"><div className="profile-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user.name.slice(0, 1).toUpperCase()}</div><h2>{user.name}</h2><p>{user.email}</p><StatusChip tone="info">{user.role}</StatusChip></aside><form className="surface-card auth-form" onSubmit={submit}>{message ? <Alert tone="success">{message}</Alert> : null}{error ? <Alert>{error}</Alert> : null}<label>Full name<Input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Email<Input value={user.email} disabled /></label><label>Role<Input value={user.role} disabled /></label><label>Avatar URL<Input type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://…" /></label><Button type="submit" loading={saving}>Save profile</Button></form></div></section>;
}
