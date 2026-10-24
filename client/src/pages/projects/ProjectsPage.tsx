import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Alert, EmptyState, Skeleton, StatusChip } from "../../components/ui";
import { normalizeApiError } from "../../services/api";
import { categories, listProjects, type Project } from "../../services/projects";

export function ProjectsPage({ explore = false }: { explore?: boolean }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let live = true;
    const timer = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const result = await listProjects({ page, search: search || undefined, category: category || undefined, status: !explore ? status || undefined : undefined, visibility: explore ? "public" : undefined, sort });
        if (live) { setRows(result.data); setTotal(result.pagination.total); }
      } catch (caught) { if (live) setError(normalizeApiError(caught).message); }
      finally { if (live) setLoading(false); }
    }, search ? 250 : 0);
    return () => { live = false; window.clearTimeout(timer); };
  }, [page, search, category, status, sort, explore, refresh]);

  const clear = () => { setSearch(""); setCategory(""); setStatus(""); setSort("-createdAt"); setPage(1); };
  return <>
    <div className="page-heading workspace-heading"><div><p className="eyebrow">{explore ? "PUBLIC CREATIVE WORK" : "YOUR CREATIVE WORK"}</p><h1>{explore ? "Explore projects" : "Projects"}</h1><p>{explore ? "Discover approved work shared with the BrandHub community." : "Find the campaigns and creative spaces you can access."}</p></div>{!explore && user?.role === "admin" ? <Link className="ui-button ui-button--primary" to="/app/projects/new">Create project</Link> : null}</div>
    <div className="surface-card workspace-filters"><label>Search projects<input className="ui-input" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by title" /></label><label>Category<select className="ui-input" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>{!explore ? <label>Status<select className="ui-input" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Current projects</option>{["active", "on_hold", "completed", "archived"].map((item) => <option key={item} value={item}>{item.replace("_", " ")}</option>)}</select></label> : null}<label>Sort<select className="ui-input" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="-createdAt">Newest</option><option value="createdAt">Oldest</option><option value="title">Title A–Z</option><option value="-title">Title Z–A</option></select></label><button className="ui-button ui-button--ghost" onClick={clear}>Clear filters</button></div>
    {error ? <Alert>{error} <button className="text-link" onClick={() => setRefresh((value) => value + 1)}>Retry</button></Alert> : null}
    {loading ? <div className="workspace-grid">{[0, 1, 2].map((item) => <Skeleton key={item} label="Loading projects" />)}</div> : rows.length ? <><div className="workspace-grid">{rows.map((project) => <Link className="surface-card workspace-card" to={`/app/projects/${project.id}`} key={project.id}><span className="eyebrow">{project.category}</span><h2>{project.title}</h2><p>{project.description}</p><div className="workspace-card-meta"><StatusChip tone={project.visibility === "public" ? "info" : "neutral"}>{project.visibility === "public" && !project.clientId ? "Public · View only" : project.status?.replace("_", " ") || "Public"}</StatusChip><span>{project.clientId ? `${project.assetCount || 0} assets` : `${project.approvedAssetCount || 0} approved assets`}</span></div></Link>)}</div><div className="workspace-pagination"><span>{total} projects</span><button className="ui-button ui-button--ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page}</span><button className="ui-button ui-button--ghost" disabled={page * 12 >= total} onClick={() => setPage(page + 1)}>Next</button></div></> : !error ? <EmptyState title={search || category || status ? "No matching projects" : "No projects yet"} message={search || category || status ? "Try clearing the filters." : "Projects you can access will appear here."} /> : null}
  </>;
}
