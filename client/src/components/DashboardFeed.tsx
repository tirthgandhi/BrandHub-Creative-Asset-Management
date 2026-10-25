import { MediaPreview } from "./MediaPreview";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMedia, type Media } from "../services/media";
import { ProjectsPage } from "../pages/projects/ProjectsPage";
import { normalizeApiError } from "../services/api";

export function DashboardFeed() {
  const [media, setMedia] = useState<Media[]>([]);
  const [visible, setVisible] = useState(6);
  const [kind, setKind] = useState("all");
  const [error, setError] = useState("");
  useEffect(() => { let live = true; (async () => {
    const all: Media[] = [];
    for (let page = 1; ; page++) {
      const result = await listMedia({ page });
      all.push(...result.data);
      if (all.length >= result.pagination.total || !result.data.length) break;
    }
    if (live) setMedia([...new Map(all.map(item => [item.checksum || item.url, item])).values()]);
  })().catch(caught => { if (live) setError(normalizeApiError(caught).message); }); return () => { live = false; }; }, []);
  return <div className="dashboard-feed"><div className="page-heading workspace-heading"><div><p className="eyebrow">THE CREATIVE FEED</p><h2>A little inspiration. Real progress.</h2><p>Images and films from your allocated projects.</p></div><Link className="ui-button ui-button--ghost" to="/app/media">Open media library</Link></div>
    <div className="action-row" aria-label="Filter media">{["all", "image", "video", "document"].map(value => <button key={value} className={`ui-button ui-button--${kind === value ? "primary" : "ghost"}`} onClick={() => { setKind(value); setVisible(6); }} aria-pressed={kind === value}>{value === "all" ? "All media" : value === "image" ? "Photography" : value === "video" ? "Films" : "Documents"}</button>)}</div>
    {error ? <p role="alert">{error}</p> : null}
    <div className="dashboard-media-grid">{media.filter(item => kind === "all" || item.mediaType === kind).slice(0, visible).map(item => <article className="surface-card dashboard-media-card" key={item.id}><MediaPreview item={item} /><div><span className="eyebrow">{item.category} · {item.mediaType}</span><h3>{item.title}</h3><Link className="text-link" to={`/app/projects/${item.projectId}`}>View project →</Link></div></article>)}</div>
    {!media.length && !error ? <p className="field-hint">Project media will appear here when it is added.</p> : null}
    {media.filter(item => kind === "all" || item.mediaType === kind).length > visible ? <button className="ui-button ui-button--ghost feed-more" onClick={() => setVisible(count => count + 6)}>Show more creative work</button> : null}
    <ProjectsPage embedded />
  </div>;
}
