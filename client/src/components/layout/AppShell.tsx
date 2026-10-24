/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, type ReactNode } from "react";
import { Bookmark, ClipboardList, Compass, FolderKanban, Home, Images, LogOut, Menu, MessageSquareMore, Palette, Settings, Users, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { BrandLogo } from "../BrandLogo";
import { ThemeSelector } from "../ui";

export type AppRole = "admin" | "designer" | "client";
const common = [
  { to: "/app/dashboard", label: "Dashboard", icon: Home },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/assets", label: "Assets", icon: Palette },
  { to: "/app/media", label: "Media", icon: Images },
  { to: "/app/bookmarks", label: "Bookmarks", icon: Bookmark },
];
export const navigationByRole: Record<AppRole, typeof common> = {
  admin: [...common, { to: "/app/reviews", label: "Reviews", icon: MessageSquareMore }, { to: "/app/admin/requests", label: "Requests", icon: ClipboardList }, { to: "/app/admin/users", label: "Users", icon: Users }],
  designer: [...common, { to: "/app/reviews", label: "Reviews", icon: MessageSquareMore }],
  client: [...common, { to: "/app/explore", label: "Explore", icon: Compass }, { to: "/app/requests", label: "Requests", icon: ClipboardList }, { to: "/app/reviews", label: "Reviews", icon: MessageSquareMore }],
};

export function AppShell({ role, name, onLogout, children }: { role: AppRole; name: string; onLogout: () => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => { document.documentElement.dataset.reduceMotion = localStorage.getItem("brandhub:reduce-motion") === "true" ? "true" : "false"; }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  return <div className="app-shell"><a className="skip-link" href="#app-content">Skip to content</a><header className="app-header"><NavLink to="/" aria-label="BrandHub home"><BrandLogo /></NavLink><button className="mobile-menu-button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X /> : <Menu />}</button><div className="header-actions"><ThemeSelector /><NavLink to="/app/profile" className="profile-link"><span className="avatar">{name.slice(0, 1).toUpperCase()}</span><span>{name}</span></NavLink></div></header><aside className={`app-sidebar ${open ? "is-open" : ""}`} aria-label="Application navigation"><nav>{navigationByRole[role].map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? "active" : ""}><Icon aria-hidden="true" /><span>{label}</span></NavLink>)}</nav><div className="sidebar-footer"><NavLink to="/app/settings"><Settings aria-hidden="true" />Settings</NavLink><button onClick={onLogout}><LogOut aria-hidden="true" />Log out</button></div></aside>{open ? <button className="nav-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} /> : null}<main id="app-content" className="app-content">{children}</main></div>;
}
