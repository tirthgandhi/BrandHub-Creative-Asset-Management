import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { normalizeApiError } from "../services/api";
import { payProjectRequest, type PaymentMethod, type ProjectRequest } from "../services/projectRequests";
import { Alert, Button, ConfirmationModal, StatusChip } from "./ui";
const formatAmount = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

export function RequestSummary({ request, onPaid }: { request: ProjectRequest; onPaid: () => void }) {
  const { user } = useAuth();
  const [checkout, setCheckout] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const contact = request.contactDetails;
  const paid = request.payment?.status === "paid";
  const pay = async (outcome: "success" | "failure") => {
    if (busy) return;
    setBusy(true); setError("");
    try { await payProjectRequest(request.id, method, outcome); setCheckout(false); onPaid(); }
    catch (caught) { setError(normalizeApiError(caught).message); }
    finally { setBusy(false); }
  };
  return <div className="request-commercials"><dl className="request-contact"><div><dt>Contact</dt><dd>{contact?.name || request.clientName || "Not provided"}</dd></div><div><dt>Email</dt><dd>{contact?.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : "Not provided"}</dd></div><div><dt>Phone</dt><dd>{contact?.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : "Not provided"}</dd></div>{contact?.company ? <div><dt>Company</dt><dd>{contact.company}</dd></div> : null}</dl>
    <div className="request-budget"><div><span className="eyebrow">Project amount · INR</span><strong>{request.amount ? formatAmount(request.amount) : "Not provided"}</strong></div><StatusChip tone={paid ? "success" : "warning"}>{paid ? "Demo payment paid" : "Unpaid"}</StatusChip></div>
    {paid ? <div className="payment-receipt"><strong>Demo receipt · {request.payment.reference}</strong><span>{formatAmount(request.payment.amount)} · {request.payment.method?.toUpperCase()} · {request.payment.paidAt ? new Date(request.payment.paidAt).toLocaleString() : ""}</span><small>Simulation only. No real money was charged.</small></div> : user?.role === "client" && request.status === "approved" && request.amount > 0 ? <Button variant="secondary" onClick={() => { setError(""); setCheckout(true); }}>Make demo payment</Button> : request.amount > 0 && request.status === "pending" ? <p className="field-hint">Demo checkout becomes available after manager approval.</p> : null}
    <ConfirmationModal open={checkout} title="Demo checkout" confirmLabel={busy ? "Processing…" : `Pay ${formatAmount(request.amount)} · demo`} onClose={() => { if (!busy) setCheckout(false); }} onConfirm={() => void pay("success")}>
      <div className="demo-checkout"><p className="payment-demo-notice">Prototype payment simulation. No money moves and no real payment details are needed.</p><h3>{request.title}</h3><strong className="checkout-total">{formatAmount(request.amount)}</strong><label>Payment method<select className="ui-input" value={method} disabled={busy} onChange={event => setMethod(event.target.value as PaymentMethod)}><option value="upi">UPI · demo</option><option value="card">Card · demo</option><option value="bank">Bank transfer · demo</option></select></label>{error ? <Alert>{error}</Alert> : null}<Button variant="ghost" disabled={busy} onClick={() => void pay("failure")}>Simulate declined payment</Button></div>
    </ConfirmationModal>
  </div>;
}
