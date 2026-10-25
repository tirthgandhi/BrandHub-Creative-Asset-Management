import { WorkspaceCharts } from "../../components/dashboard/WorkspaceCharts";
import { roleLabels } from "../../config/access";
import { DashboardFeed } from "../../components/DashboardFeed";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, EmptyState, Skeleton, StatusChip } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { normalizeApiError } from "../../services/api";
import { getDashboardStats, type DashboardStats } from "../../services/dashboard";

type Card = { label: string; value: number; href: string; detail: string };

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => { let live = true; setLoading(true); getDashboardStats().then((data) => { if (live) { setStats(data); setError(""); } }).catch((caught) => { if (live) setError(normalizeApiError(caught).message); }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, [revision]);
  if (!user) return null;
  const m = stats?.metrics;
  const cards: Card[] = !m ? [] : ["project_manager", "super_admin"].includes(user.role) ? [
    { label: "Projects", value: m.projects, href: "/app/projects", detail: "Across the workspace" },
    { label: "Active users", value: m.activeUsers || 0, href: "/app/management/users", detail: "Team and clients" },
    { label: "Awaiting review", value: m.pendingReviews, href: "/app/assets?status=in_review", detail: "Creative decisions" },
    { label: "Project requests", value: m.requests.pending, href: "/app/management/requests", detail: "Pending approval" },
    { label: "Clients without projects", value: m.clientsWithoutProject || 0, href: "/app/management/users", detail: "May need onboarding" },
    { label: "Media files", value: m.media, href: "/app/media", detail: "Across projects" },
  ] : user.role === "designer" ? [
    { label: "Assigned projects", value: m.projects, href: "/app/projects", detail: "Your creative work" },
    { label: "Draft assets", value: m.assets.draft, href: "/app/assets?status=draft", detail: "Ready to prepare" },
    { label: "Changes requested", value: m.assets.changes_requested, href: "/app/assets?status=changes_requested", detail: "Feedback to address" },
    { label: "In review", value: m.assets.in_review, href: "/app/assets?status=in_review", detail: "Waiting for a decision" },
    { label: "Media files", value: m.media, href: "/app/media", detail: "Project posts and reels" },
  ] : [
    { label: "My projects", value: m.projects, href: "/app/projects", detail: "Your brand campaigns" },
    { label: "Awaiting my review", value: m.assets.in_review, href: "/app/assets?status=in_review", detail: "Ready for your feedback" },
    { label: "Approved assets", value: m.assets.approved, href: "/app/assets?status=approved", detail: "Ready to use" },
    { label: "Pending requests", value: m.requests.pending, href: "/app/requests", detail: "Submitted briefs" },
    { label: "Project media", value: m.media, href: "/app/media", detail: "Posts, stories and reels" },
  ];
  const actions = ["project_manager", "super_admin"].includes(user.role) ? [
    ["Create project", "/app/projects/new"], ["Manage users", "/app/management/users"], ["Review requests", "/app/management/requests"],
  ] : user.role === "designer" ? [
    ["Open projects", "/app/projects"], ["Upload project file", "/app/media/upload"], ["View feedback", "/app/assets?status=changes_requested"],
  ] : [["Request a project", "/app/requests/new"], ["Review assets", "/app/assets?status=in_review"], ["My projects", "/app/projects"]];
  return <section><header className="page-heading"><p className="eyebrow">WORKSPACE OVERVIEW</p><h1>Welcome, {user.name.split(" ")[0]}.</h1><p>Your current projects, creative work, and recent decisions.</p></header>
    {error ? <Alert>{error} <button className="text-link" onClick={() => setRevision((value) => value + 1)}>Retry</button></Alert> : null}
    {loading ? <div className="dashboard-stat-grid">{[0, 1, 2, 3].map((item) => <Skeleton key={item} label="Loading dashboard" />)}</div> : stats ? <>
      <div className="dashboard-stat-grid">{cards.map((card) => <Link className="surface-card dashboard-stat-card" to={card.href} key={card.label}><span className="eyebrow">{card.label}</span><strong>{card.value.toLocaleString()}</strong><span>{card.detail}</span></Link>)}</div>
      {user.role !== "client" ? <WorkspaceCharts stats={stats} role={user.role} /> : null}
      <div className="dashboard-grid"><article className="surface-card welcome-card"><div><StatusChip tone="info">{roleLabels[user.role]}</StatusChip><h2>{["project_manager", "super_admin"].includes(user.role) ? "Keep the team moving" : user.role === "designer" ? "Create and collaborate" : "Shape your next campaign"}</h2><p>Choose a task to continue your work.</p></div><div className="action-row">{actions.map(([label, href]) => <Link className="ui-button ui-button--ghost" to={href} key={href}>{label}</Link>)}</div></article>
      <article className="surface-card"><h2>Recent activity</h2>{stats.recentActivity.length ? <ol className="asset-collab-list">{stats.recentActivity.map((event) => <li key={event.id}><Link to={event.href}>{event.description}</Link><small>{new Date(event.at).toLocaleString()}</small></li>)}</ol> : <p className="field-hint">Review activity will appear here as your team collaborates.</p>}</article></div>
      <DashboardFeed />
      {user.role === "client" && m?.projects === 0 ? <EmptyState title="Start your first project" message="Send a brief to the BrandHub team and track its progress." action={<Link className="ui-button ui-button--primary" to="/app/requests/new">Request a project</Link>} /> : null}
    </> : null}</section>;
}
