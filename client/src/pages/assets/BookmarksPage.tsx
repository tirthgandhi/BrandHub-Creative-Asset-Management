import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, EmptyState, Skeleton, StatusChip } from "../../components/ui";
import { normalizeApiError } from "../../services/api";
import { listBookmarks, type BookmarkedAsset } from "../../services/collaboration";

export function BookmarksPage() {
  const [rows, setRows] = useState<BookmarkedAsset[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => { let live = true; setLoading(true); listBookmarks(page).then((result) => { if (live) { setRows(result.data); setTotal(result.pagination.total); setError(""); } }).catch((caught) => { if (live) setError(normalizeApiError(caught).message); }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, [page, revision]);
  return <section><header className="page-heading"><p className="eyebrow">SAVED WORK</p><h1>Bookmarks</h1><p>Creative assets you saved for quick access.</p></header>{error ? <Alert>{error} <button className="text-link" onClick={() => setRevision((value) => value + 1)}>Retry</button></Alert> : null}{loading ? <Skeleton label="Loading bookmarks" /> : rows.length ? <><div className="workspace-grid asset-grid">{rows.map((row) => <Link className="surface-card asset-card" key={row.id} to={`/app/assets/${row.asset.id}`}><div className="asset-thumb"><img src={row.asset.thumbnailUrl} alt={row.asset.title} loading="lazy" /></div><div><span className="eyebrow">{row.asset.project.title}</span><h2>{row.asset.title}</h2><StatusChip>{row.asset.status.replaceAll("_", " ")}</StatusChip></div></Link>)}</div><div className="workspace-pagination"><span>{total} bookmarks</span><button className="ui-button ui-button--ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page}</span><button className="ui-button ui-button--ghost" disabled={page * 12 >= total} onClick={() => setPage(page + 1)}>Next</button></div></> : !error ? <EmptyState title="No bookmarks yet" message="Save an asset from its detail page and it will appear here." /> : null}</section>;
}
