import { useEffect, useState, type FormEvent } from "react";
import { Alert, Button, ConfirmationModal, StatusChip } from "../ui";
import { useAuth } from "../../context/AuthContext";
import { normalizeApiError } from "../../services/api";
import type { Asset } from "../../services/assets";
import {
  addBookmark, deleteComment, listComments, listReviewHistory, listRevisions,
  postComment, removeBookmark, reviewAsset, submitAssetForReview, uploadAssetRevision,
  type Comment, type ReviewEvent, type Revision,
} from "../../services/collaboration";

type Props = { asset: Asset; onChanged: () => Promise<void>; revision: number };
const message = (error: unknown) => normalizeApiError(error).message;
const date = (value: string) => new Date(value).toLocaleString();

export function BookmarkButton({ asset, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toggle = async () => {
    setBusy(true); setError("");
    try { if (asset.isBookmarked) await removeBookmark(asset.id); else await addBookmark(asset.id); await onChanged(); }
    catch (caught) { setError(message(caught)); }
    finally { setBusy(false); }
  };
  return <section className="asset-collab-panel" aria-label="Bookmark"><Button variant="ghost" loading={busy} onClick={toggle}>{asset.isBookmarked ? "Remove bookmark" : "Bookmark asset"}</Button>{error ? <Alert>{error}</Alert> : null}</section>;
}

export function ReviewPanel({ asset, onChanged, revision }: Props) {
  const { user } = useAuth();
  const [history, setHistory] = useState<ReviewEvent[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => { let live = true; listReviewHistory(asset.id).then((rows) => { if (live) setHistory(rows); }).catch((caught) => { if (live) setError(message(caught)); }); return () => { live = false; }; }, [asset.id, revision]);
  const act = async (action: "submit" | "approve" | "request_changes" | "revision") => {
    setBusy(true); setError("");
    try {
      if (action === "submit") await submitAssetForReview(asset.id, asset.currentVersion);
      if (action === "approve") await reviewAsset(asset.id, "approve", asset.currentVersion, note);
      if (action === "request_changes") {
        if (!note.trim()) { setError("Add a review note before requesting changes."); return; }
        await reviewAsset(asset.id, "request_changes", asset.currentVersion, note);
      }
      if (action === "revision") {
        if (!file) { setError("Choose a revised image."); return; }
        await uploadAssetRevision(asset.id, file, asset.currentVersion, note);
        setFile(null);
      }
      setNote(""); setConfirm(false); await onChanged();
    } catch (caught) { setError(message(caught)); }
    finally { setBusy(false); }
  };
  const canSubmit = asset.status === "draft" && (["project_manager", "super_admin"].includes(user?.role || "") || user?.role === "designer");
  const canReview = asset.status === "in_review" && (["project_manager", "super_admin"].includes(user?.role || "") || user?.role === "client");
  const canRevise = asset.status === "changes_requested" && (["project_manager", "super_admin"].includes(user?.role || "") || user?.role === "designer");
  return <section className="asset-collab-panel" aria-label="Review panel"><h3>Review</h3><p>Version {asset.currentVersion} · <StatusChip>{asset.status.replaceAll("_", " ")}</StatusChip></p>
    {error ? <Alert>{error} <button className="text-link" onClick={() => void onChanged()}>Refresh asset</button></Alert> : null}
    {canSubmit ? <Button loading={busy} onClick={() => void act("submit")}>Submit for review</Button> : null}
    {canReview ? <div className="workspace-form"><label>Review note<textarea className="ui-input" maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Explain your decision" /></label><div className="action-row"><Button loading={busy} onClick={() => setConfirm(true)}>Approve final version</Button><Button variant="secondary" loading={busy} onClick={() => void act("request_changes")}>Request changes</Button></div></div> : null}
    {canRevise ? <div className="workspace-form"><label>Revised image<input className="ui-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><label>Revision note<textarea className="ui-input" maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} /></label><Button loading={busy} onClick={() => void act("revision")}>Upload revision</Button></div> : null}
    <h4>Review history</h4>{history.length ? <ol className="asset-collab-list">{history.map((event) => <li key={event.id}><strong>{event.action.replaceAll("_", " ")}</strong> · v{event.version} · {event.actor.name || "Team member"}<small>{date(event.createdAt)}</small>{event.note ? <p>{event.note}</p> : null}</li>)}</ol> : <p className="field-hint">No review actions yet.</p>}
    <ConfirmationModal open={confirm} title="Approve this asset?" confirmLabel="Approve version" onClose={() => setConfirm(false)} onConfirm={() => void act("approve")}>Version {asset.currentVersion} will be marked approved for this project.</ConfirmationModal>
  </section>;
}

export function RevisionList({ asset, revision }: Props) {
  const [rows, setRows] = useState<Revision[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { let live = true; listRevisions(asset.id).then((items) => { if (live) setRows(items); }).catch((caught) => { if (live) setError(message(caught)); }); return () => { live = false; }; }, [asset.id, revision]);
  return <section className="asset-collab-panel" aria-label="Revision list"><h3>Versions</h3>{error ? <Alert>{error}</Alert> : null}{rows.length ? <ol className="asset-collab-list">{rows.map((item) => <li key={item.version}><strong>Version {item.version}</strong> · {item.uploadedBy.name || "Team member"}<small>{date(item.createdAt)}</small>{item.note ? <p>{item.note}</p> : null}</li>)}</ol> : <p className="field-hint">No versions available.</p>}</section>;
}

export function CommentsPanel({ asset, revision }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refresh = async () => { setRows(await listComments(asset.id)); };
  useEffect(() => { let live = true; listComments(asset.id).then((items) => { if (live) setRows(items); }).catch((caught) => { if (live) setError(message(caught)); }); return () => { live = false; }; }, [asset.id, revision]);
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!content.trim()) return; setBusy(true); setError(""); try { await postComment(asset.id, content, asset.currentVersion); setContent(""); await refresh(); } catch (caught) { setError(message(caught)); } finally { setBusy(false); } };
  const remove = async (id: string) => { setBusy(true); setError(""); try { await deleteComment(id); await refresh(); } catch (caught) { setError(message(caught)); } finally { setBusy(false); } };
  return <section className="asset-collab-panel" aria-label="Comments panel"><h3>Comments</h3>{error ? <Alert>{error}</Alert> : null}{rows.length ? <ol className="asset-collab-list">{rows.map((item) => <li key={item.id}><strong>{item.user.name || "Team member"}</strong> · v{item.version}<small>{date(item.createdAt)}</small><p>{item.content}</p>{["project_manager", "super_admin"].includes(user?.role || "") || item.user.id === user?.id ? <button className="text-link" disabled={busy} onClick={() => void remove(item.id)}>Delete comment</button> : null}</li>)}</ol> : <p className="field-hint">No comments yet.</p>}<form className="workspace-form" onSubmit={(event) => void submit(event)}><label>Add a comment<textarea className="ui-input" required maxLength={1000} value={content} onChange={(event) => setContent(event.target.value)} /></label><Button type="submit" loading={busy}>Post comment</Button></form></section>;
}
