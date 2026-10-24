import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { AlertCircle, CheckCircle2, Inbox, LockKeyhole, X } from "lucide-react";
import { useAtmosphere } from "../../context/AtmosphereContext";
import { themes, type Preference } from "../../data/themes";

export function Button({ variant = "primary", loading, children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost"; loading?: boolean }) {
  return <button className={`ui-button ui-button--${variant} ${className}`} disabled={loading || props.disabled} {...props}>{loading ? <span className="ui-spinner" aria-hidden="true" /> : null}<span>{loading ? "Please wait" : children}</span></button>;
}

export function Input({ invalid, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className="ui-input" aria-invalid={invalid || undefined} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="ui-input ui-select" {...props} />;
}

export function FormField({ label, error, hint, children, required }: { label: string; error?: string; hint?: string; children: ReactNode; required?: boolean }) {
  const id = useId();
  return <div className="form-field"><label htmlFor={id}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label><div data-field-id={id}>{children}</div>{hint && !error ? <p className="field-hint">{hint}</p> : null}{error ? <p className="field-error" role="alert">{error}</p> : null}</div>;
}

export function Checkbox({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="ui-checkbox"><input type="checkbox" {...props} /><span>{label}</span></label>;
}

export function StatusChip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return <span className={`status-chip status-chip--${tone}`}>{children}</span>;
}

export function Skeleton({ label = "Loading content" }: { label?: string }) {
  return <div className="skeleton" role="status"><span className="sr-only">{label}</span></div>;
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <section className="empty-state"><Inbox aria-hidden="true" /><h2>{title}</h2><p>{message}</p>{action}</section>;
}

export function Alert({ tone = "error", title, children }: { tone?: "error" | "success" | "info"; title?: string; children: ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return <div className={`ui-alert ui-alert--${tone}`} role={tone === "error" ? "alert" : "status"}><Icon aria-hidden="true" /><div>{title ? <strong>{title}</strong> : null}<div>{children}</div></div></div>;
}

export function PermissionDenied() {
  return <EmptyState title="Permission denied" message="Your account does not have access to this page." action={<LockKeyhole aria-hidden="true" />} />;
}

export function ThemeSelector() {
  const { preference, select } = useAtmosphere();
  return <label className="theme-control"><span>Atmosphere</span><select value={preference} onChange={(event) => select(event.target.value as Preference)} aria-label="Atmosphere"><option value="auto">Auto</option>{themes.map((theme) => <option key={theme} value={theme}>{theme[0].toUpperCase() + theme.slice(1)}</option>)}</select></label>;
}

export function ConfirmationModal({ open, title, children, confirmLabel = "Confirm", danger, onConfirm, onClose }: { open: boolean; title: string; children: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = dialog.current;
    node?.querySelector<HTMLElement>("button")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>("button,[href],input,select,textarea,[tabindex]:not([tabindex='-1'])")];
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialog} className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button className="dialog-close" aria-label="Close dialog" onClick={onClose}><X /></button><h2 id="dialog-title">{title}</h2><div>{children}</div><div className="dialog-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button></div></div></div>;
}
