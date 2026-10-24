import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, EmptyState, Skeleton, StatusChip } from "../../components/ui";
import { normalizeApiError } from "../../services/api";
import { listMedia, mediaUrl, type Media } from "../../services/media";

export function MediaLibraryPage() {
  const [params] = useSearchParams();
  const projectId = params.get("projectId") || "";
  const [category, setCategory] = useState("");
  const [contentType, setContentType] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Media[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    listMedia({ projectId: projectId || undefined, category: category || undefined, contentType: contentType || undefined, page })
      .then((result) => { if (live) { setRows(result.data); setTotal(result.pagination.total); } })
      .catch((caught) => { if (live) setError(normalizeApiError(caught).message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [projectId, category, contentType, page, revision]);
  return <section><div className="page-heading workspace-heading"><div><p className="eyebrow">CREATIVE MEDIA</p><h1>Project media</h1><p>Posts, stories, reels, and gallery files from projects you can access.</p></div><Link className="ui-button ui-button--primary" to={`/app/media/upload${projectId ? `?projectId=${projectId}` : ""}`}>Upload media</Link></div>
    <div className="surface-card workspace-filters"><label>Category<select className="ui-input" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{["beauty", "beverages", "electronics", "fashion", "furniture", "shoes"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Content<select className="ui-input" value={contentType} onChange={(event) => { setContentType(event.target.value); setPage(1); }}><option value="">All content</option>{["gallery", "post", "story", "reel"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>
    {error ? <Alert>{error} <button className="text-link" onClick={() => setRevision((value) => value + 1)}>Retry</button></Alert> : null}
    {loading ? <div className="workspace-grid">{[0, 1, 2].map((item) => <Skeleton key={item} label="Loading media" />)}</div> : rows.length ? <><div className="workspace-grid asset-grid">{rows.map((item) => <article className="surface-card asset-card" key={item.id}><div className="asset-thumb">{item.mediaType === "video" ? <video src={mediaUrl(item.url)} poster={item.thumbnailUrl ? mediaUrl(item.thumbnailUrl) : undefined} controls preload="metadata" playsInline /> : <img src={mediaUrl(item.url)} alt={item.title} loading="lazy" />}</div><div><span className="eyebrow">{item.category} · {item.contentType}</span><h2>{item.title}</h2><div className="workspace-card-meta"><StatusChip>{item.status}</StatusChip><span>{item.storageType === "local" ? "Demo" : "Uploaded"}</span></div></div></article>)}</div><div className="workspace-pagination"><span>{total} media files</span><button className="ui-button ui-button--ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page}</span><button className="ui-button ui-button--ghost" disabled={page * 12 >= total} onClick={() => setPage(page + 1)}>Next</button></div></> : !error ? <EmptyState title="No media yet" message="Upload a project file to begin the gallery." /> : null}
  </section>;
}
