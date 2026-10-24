import { ArrowRight, Compass, FolderPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, EmptyState, StatusChip } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <section><header className="page-heading"><p className="eyebrow">WORKSPACE OVERVIEW</p><h1>Welcome, {user.name.split(" ")[0]}.</h1><p>Your projects, requests, and creative assets are ready to explore.</p></header><div className="dashboard-grid"><article className="surface-card welcome-card"><div><StatusChip tone="info">{user.role}</StatusChip><h2>{user.role === "admin" ? "Keep the team moving" : user.role === "designer" ? "Your creative workspace" : "Your projects, in one place"}</h2><p>{user.role === "admin" ? "Manage your team, project briefs, and active creative work." : user.role === "designer" ? "Open your assigned projects and upload new creative assets." : "View your projects, request new work, or browse approved public work."}</p></div>{user.role === "admin" ? <div className="action-row"><Link to="/app/projects"><Button>Manage projects <ArrowRight /></Button></Link><Link to="/app/admin/users"><Button variant="ghost">Manage users <Users /></Button></Link></div> : user.role === "client" ? <div className="action-row"><Link to="/app/requests/new"><Button>Request a project <FolderPlus /></Button></Link><Link to="/app/explore"><Button variant="ghost">Browse public projects <Compass /></Button></Link></div> : <Link to="/app/projects"><Button>View assigned projects <ArrowRight /></Button></Link>}</article><article className="surface-card"><EmptyState title="Nothing needs attention" message="Activity and project metrics are reserved for Phase 6." /></article></div></section>;
}
