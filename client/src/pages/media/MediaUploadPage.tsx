import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Skeleton } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { normalizeApiError } from "../../services/api";
import { uploadMedia, type Media } from "../../services/media";
import { listProjects, type Project } from "../../services/projects";

const categories = ["beauty", "beverages", "electronics", "fashion", "furniture", "shoes", "uncategorized"];
export function MediaUploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState(params.get("projectId") || "");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("uncategorized");
  const [contentType, setContentType] = useState<Media["contentType"]>("gallery");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => { let live = true; listProjects({ limit: 50 }).then((result) => { if (live) setProjects(result.data.filter((project) => project.status !== "archived" && (["project_manager", "super_admin"].includes(user?.role || "") || project.clientId === user?.id || project.designerIds?.includes(user?.id || "")))); }).catch((caught) => { if (live) setError(normalizeApiError(caught).message); }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, [user?.id, user?.role]);
  useEffect(() => { if (!file) { setPreview(""); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  const choose = (selected: File | null) => {
    setError(""); setFile(null);
    if (!selected) { setFile(null); return; }
    const image = ["image/jpeg", "image/png", "image/webp"].includes(selected.type);
    const video = ["video/mp4", "video/webm"].includes(selected.type);
    const document = /\.(pdf|docx|xlsx|pptx|txt|csv|zip)$/i.test(selected.name);
    if (!image && !video && !document || selected.size > (image ? 5 : video ? 20 : 10) * 1024 * 1024) { setError("Choose an image (5 MB), video (20 MB), or PDF, DOCX, XLSX, PPTX, TXT, CSV or ZIP (10 MB)."); return; }
    if (contentType === "reel" && !video) { setError("Reels need a video file."); return; }
    if (document) setContentType("gallery");
    setFile(selected);
    if (!title) setTitle(selected.name.replace(/\.[^.]+$/, "").replaceAll(/[-_]/g, " "));
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    if (!file || !projectId) { setError("Choose a project and file."); return; }
    setBusy(true); setProgress(0); setError("");
    try { await uploadMedia({ projectId, title, category, contentType, file, onProgress: setProgress }); setProgress(100); navigate(`/app/media?projectId=${projectId}`); }
    catch (caught) { setError(normalizeApiError(caught).message); }
    finally { setBusy(false); }
  };
  return <section><div className="page-heading"><p className="eyebrow">CREATIVE MEDIA</p><h1>Upload project file</h1><p>Files are saved to your project and visible only to authorized members.</p></div>{loading ? <Skeleton label="Loading projects" /> : <form className="surface-card workspace-form" onSubmit={submit}>{error ? <Alert>{error}</Alert> : null}<label>Project *<select className="ui-input" required value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label><label>Title *<input className="ui-input" required minLength={2} maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Category<select className="ui-input" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label>Content type<select className="ui-input" value={contentType} onChange={(event) => { setContentType(event.target.value as Media["contentType"]); setFile(null); }}><option value="gallery">Gallery</option><option value="post">Post</option><option value="story">Story</option><option value="reel">Reel</option></select></label><label>Photo, video or document *<input className="ui-input" type="file" required accept={contentType === "reel" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,video/mp4,video/webm,.pdf,.docx,.xlsx,.pptx,.txt,.csv,.zip"} onChange={(event) => choose(event.target.files?.[0] || null)} /></label><p className="field-hint">Images up to 5 MB · Videos up to 20 MB · Documents up to 10 MB</p>{preview ? file?.type.startsWith("video/") ? <video className="asset-upload-preview" src={preview} controls /> : file?.type.startsWith("image/") ? <img className="asset-upload-preview" src={preview} alt="Selected media preview" /> : <div className="document-preview"><strong>{file?.name}</strong><span>Document ready to upload · {((file?.size || 0) / 1024).toFixed(1)} KB</span></div> : null}{busy ? <progress value={progress} max={100} aria-label="Upload progress" /> : null}<div className="action-row"><Button type="submit" loading={busy} disabled={!projects.length}>Upload media</Button><Link className="ui-button ui-button--ghost" to="/app/media">Cancel</Link></div></form>}</section>;
}
