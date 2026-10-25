import { MediaPreview } from "../../components/MediaPreview";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert, Button, ConfirmationModal, EmptyState, Skeleton, StatusChip } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { normalizeApiError } from "../../services/api";
import { deleteMedia, listMedia, updateMedia, type Media } from "../../services/media";

export function MediaLibraryPage() {
  const { user } = useAuth();
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
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    setLoading(true); setError("");
    listMedia({ projectId: projectId || undefined, category: category || undefined, contentType: contentType || undefined, page })
      .then((result) => { if (live) { setRows(result.data); setTotal(result.pagination.total); } })
      .catch((caught) => { if (live) setError(normalizeApiError(caught).message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [projectId, category, contentType, page, revision]);
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!editing || busy) return;
    setBusy(true); setError("");
    try { await updateMedia(editing, editTitle, editDescription); setEditing(null); setRevision((value) => value + 1); }
    catch (caught) { setError(normalizeApiError(caught).message); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!confirmId || busy) return;
    setBusy(true); setError("");
    try { await deleteMedia(confirmId); setConfirmId(null); setRevision((value) => value + 1); }
    catch (caught) { setError(normalizeApiError(caught).message); setConfirmId(null); }
    finally { setBusy(false); }
  };
  return <section><div className="page-heading workspace-heading"><div><p className="eyebrow">CREATIVE MEDIA</p><h1>Project media</h1><p>Posts, stories, reels, and gallery files from projects you can access.</p></div>{user?.role !== "client" ? <Link className="ui-button ui-button--primary" to={`/app/media/upload${projectId ? `?projectId=${projectId}` : ""}`}>Upload media</Link> : null}</div>
    <div className="surface-card workspace-filters"><label>Category<select className="ui-input" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">All categories</option>{["beauty", "beverages", "electronics", "fashion", "furniture", "shoes", "uncategorized"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Content<select className="ui-input" value={contentType} onChange={(event) => { setContentType(event.target.value); setPage(1); }}><option value="">All content</option>{["gallery", "post", "story", "reel"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div>
    {error ? <Alert>{error} <button className="text-link" onClick={() => setRevision((value) => value + 1)}>Retry</button></Alert> : null}
    {loading ? <div className="workspace-grid">{[0, 1, 2].map((item) => <Skeleton key={item} label="Loading media" />)}</div> : rows.length ? <><div className="workspace-grid asset-grid">{rows.map((item) => <article className="surface-card asset-card" key={item.id}><div className="asset-thumb"><MediaPreview item={item} /></div><div><span className="eyebrow">{item.category} · {item.contentType}</span><h2>{item.title}</h2><div className="workspace-card-meta"><StatusChip>{item.status}</StatusChip><span>{item.storageType === "local" ? "Demo" : "Uploaded"}</span></div>{item.description && item.storageType === "gridfs" ? <p>{item.description}</p> : null}{item.storageType === "gridfs" && user?.role !== "client" && (["project_manager", "super_admin"].includes(user?.role || "") || item.uploadedBy === user?.id) ? <div className="action-row"><Button variant="ghost" onClick={() => { setEditing(item.id); setEditTitle(item.title); setEditDescription(item.description || ""); }}>Edit details</Button>{item.status !== "approved" ? <Button variant="danger" onClick={() => setConfirmId(item.id)}>Delete</Button> : null}</div> : null}{editing === item.id ? <form className="workspace-form" onSubmit={(event) => void save(event)}><label>Title<input className="ui-input" required minLength={2} maxLength={120} value={editTitle} onChange={(event) => setEditTitle(event.target.value)} /></label><label>Description<textarea className="ui-input" maxLength={2000} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} /></label><div className="action-row"><Button type="submit" loading={busy}>Save</Button><Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div></form> : null}</div></article>)}</div><div className="workspace-pagination"><span>{total} media files</span><button className="ui-button ui-button--ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page}</span><button className="ui-button ui-button--ghost" disabled={page * 12 >= total} onClick={() => setPage(page + 1)}>Next</button></div></> : !error ? <EmptyState title="No media yet" message="Upload a project file to begin the gallery." /> : null}
    <ConfirmationModal open={Boolean(confirmId)} title="Delete this upload?" danger confirmLabel="Delete media" onClose={() => setConfirmId(null)} onConfirm={() => void remove()}>The uploaded file and its project record will be removed. This action cannot be undone.</ConfirmationModal>
  </section>;
}
