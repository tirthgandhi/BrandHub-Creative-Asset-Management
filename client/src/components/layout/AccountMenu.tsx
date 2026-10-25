import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, LogOut, UserRound, Settings, KeyRound, FolderKanban, FileText } from "lucide-react";
import type { AppRole } from "../../types/auth";
import { roleLabels } from "../../config/access";

export function AccountMenu({ name, role, onLogout }: { name: string; role: AppRole; onLogout: () => Promise<void> }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const location = useLocation();
  useEffect(() => { if (ref.current) ref.current.open = false; }, [location.pathname]);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) ref.current.open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && ref.current?.open) { ref.current.open = false; ref.current.querySelector("summary")?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, []);
  return <details className="account-menu" ref={ref}><summary aria-label={`Account options for ${name}`}><span className="avatar">{name.slice(0, 1).toUpperCase()}</span><span className="account-menu-name">{name}</span><ChevronDown size={16} aria-hidden="true" /></summary><div className="account-menu-panel"><div className="account-menu-identity"><strong>{name}</strong><span>{roleLabels[role]}</span></div><Link to="/app/profile"><UserRound />My profile</Link><Link to="/app/projects"><FolderKanban />My projects</Link><Link to="/app/settings"><Settings />Settings</Link><Link to="/change-password"><KeyRound />Change password</Link>{["project_manager", "super_admin"].includes(role) ? <Link to="/app/reports"><FileText />Download reports</Link> : null}{role === "client" ? <Link to="/app/requests/new">Request a project</Link> : role === "designer" ? <Link to="/app/media/upload">Upload project file</Link> : <Link to={role === "super_admin" ? "/app/super-admin/users" : "/app/management/users"}>Manage team</Link>}<button type="button" onClick={() => { if (ref.current) ref.current.open = false; void onLogout().catch(() => {}); }}><LogOut />Log out</button></div></details>;
}
