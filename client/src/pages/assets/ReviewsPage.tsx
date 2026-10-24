import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, EmptyState, Skeleton, StatusChip } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { normalizeApiError } from "../../services/api";
import { listAssets, type Asset } from "../../services/assets";

export function ReviewsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState(user?.role === "designer" ? "changes_requested" : "in_review");
  const [rows, setRows] = useState<Asset[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => { let live = true; setLoading(true); listAssets({ status, page, limit: 12 }).then((result) => { if (live) { setRows(result.data); setTotal(result.pagination.total); setError(""); } }).catch((caught) => { if (live) setError(normalizeApiError(caught).message); }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, [status, page, revision]);
  const statuses = user?.role === "designer" ? ["changes_requested", "draft", "in_review", "approved"] : ["in_review", "changes_requested", "approved"];
  return <section><header className="page-heading"><p className="eyebrow">COLLABORATION</p><h1>Review queue</h1><p>Open an asset to see feedback, comments, and version history.</p></header><div className="surface-card workspace-filters"><label>Status<select className="ui-input" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{statuses.map((item) => <option value={item} key={item}>{item.replaceAll("_", " ")}</option>)}</select></label></div>{error ? <Alert>{error} <button className="text-link" onClick={() => setRevision((value) => value + 1)}>Retry</button></Alert> : null}{loading ? <Skeleton label="Loading review queue" /> : rows.length ? <><div className="workspace-grid asset-grid">{rows.map((asset) => <Link className="surface-card asset-card" key={asset.id} to={`/app/assets/${asset.id}`}><div className="asset-thumb"><img src={asset.thumbnailUrl} alt={asset.title} loading="lazy" /></div><div><h2>{asset.title}</h2><div className="workspace-card-meta"><StatusChip>{asset.status.replaceAll("_", " ")}</StatusChip><span>Version {asset.currentVersion}</span></div></div></Link>)}</div><div className="workspace-pagination"><span>{total} assets</span><button className="ui-button ui-button--ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page}</span><button className="ui-button ui-button--ghost" disabled={page * 12 >= total} onClick={() => setPage(page + 1)}>Next</button></div></> : !error ? <EmptyState title="Queue is clear" message="No assets match this review status." /> : null}</section>;
}
