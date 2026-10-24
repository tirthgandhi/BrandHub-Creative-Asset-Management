import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";

// Shared controls for atmosphere-themed authentication screens.

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`sg-card ${className}`}>
      {children}
    </div>
  );
}

// ─── Glass Input ─────────────────────────────────────────────────────────────

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  icon?: ReactNode;
}

export function GlassInput({ invalid, icon, className = "", ...props }: GlassInputProps) {
  return (
    <div className={`sg-input-wrap ${icon ? "sg-input-wrap--icon" : ""}`}>
      {icon && <span className="sg-input-icon" aria-hidden="true">{icon}</span>}
      <input
        className={`sg-input ${invalid ? "sg-input--invalid" : ""} ${className}`}
        aria-invalid={invalid || undefined}
        {...props}
      />
    </div>
  );
}

// ─── Password Input ───────────────────────────────────────────────────────────

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  invalid?: boolean;
}

export function PasswordInput({ invalid, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="sg-input-wrap sg-input-wrap--password">
      <input
        type={show ? "text" : "password"}
        className={`sg-input ${invalid ? "sg-input--invalid" : ""}`}
        aria-invalid={invalid || undefined}
        {...props}
      />
      <button
        type="button"
        className="sg-pw-toggle"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((v) => !v)}
        tabIndex={0}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

// ─── Password Strength Indicator ─────────────────────────────────────────────

interface PasswordStrengthProps {
  password: string;
}

function getStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"];
  return { score, label: labels[score] ?? "" };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, label } = getStrength(password);
  if (!password) return null;
  const colors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];
  return (
    <div className="sg-pw-strength" role="status" aria-live="polite">
      <div className="sg-pw-bars">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="sg-pw-bar"
            style={{ background: i <= score ? colors[score] : undefined }}
          />
        ))}
      </div>
      {label && (
        <span className="sg-pw-label" style={{ color: colors[score] }}>
          {label}
        </span>
      )}
    </div>
  );
}

// ─── Glass Button ─────────────────────────────────────────────────────────────

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "ghost" | "danger";
  fullWidth?: boolean;
}

export function GlassButton({
  loading,
  variant = "primary",
  fullWidth,
  children,
  className = "",
  disabled,
  ...props
}: GlassButtonProps) {
  return (
    <button
      className={`sg-btn sg-btn--${variant} ${fullWidth ? "sg-btn--full" : ""} ${className}`}
      disabled={loading || disabled}
      aria-busy={loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="sg-btn-spinner" aria-hidden="true" />}
      <span>{loading ? "Please wait…" : children}</span>
    </button>
  );
}

// ─── OTP Input ────────────────────────────────────────────────────────────────

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}

export function OTPInput({ length = 6, value, onChange, invalid }: OTPInputProps) {
  const digits = value.padEnd(length, "").split("").slice(0, length);

  const handleChange = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char.replace(/\D/g, "").slice(-1);
    onChange(next.join("").trimEnd());
    // Auto-advance
    if (char && index < length - 1) {
      const el = document.getElementById(`otp-${index + 1}`);
      (el as HTMLInputElement | null)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const el = document.getElementById(`otp-${index - 1}`);
      (el as HTMLInputElement | null)?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(text);
    const el = document.getElementById(`otp-${Math.min(text.length, length - 1)}`);
    (el as HTMLInputElement | null)?.focus();
  };

  return (
    <div className="sg-otp" role="group" aria-label="Verification code">
      {digits.map((d, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          value={d}
          className={`sg-otp-digit ${invalid ? "sg-otp-digit--invalid" : ""}`}
          aria-label={`Digit ${i + 1}`}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}

// ─── Form Error ───────────────────────────────────────────────────────────────

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="sg-form-error" role="alert">
      {message}
    </p>
  );
}

// ─── Auth Divider ─────────────────────────────────────────────────────────────

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="sg-divider" aria-hidden="true">
      <span className="sg-divider-line" />
      <span className="sg-divider-label">{label}</span>
      <span className="sg-divider-line" />
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────

export function LoadingSpinner({ size = 24, label = "Loading" }: { size?: number; label?: string }) {
  return (
    <span className="sg-spinner-wrap" role="status">
      <Loader2 size={size} className="sg-spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

// ─── Success State ─────────────────────────────────────────────────────────────

export function SuccessState({ title, message, children }: { title: string; message: string; children?: ReactNode }) {
  return (
    <div className="sg-success">
      <div className="sg-success-icon" aria-hidden="true">
        <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="sg-check-circle" cx="26" cy="26" r="24" />
          <path className="sg-check-path" d="M14 26l8 8 16-16" />
        </svg>
      </div>
      <h2 className="sg-success-title">{title}</h2>
      <p className="sg-success-message">{message}</p>
      {children}
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

export function ErrorState({ title, message, children }: { title: string; message: string; children?: ReactNode }) {
  return (
    <div className="sg-error-state" role="alert">
      <div className="sg-error-icon" aria-hidden="true">⚠</div>
      <h2 className="sg-error-title">{title}</h2>
      <p className="sg-error-message">{message}</p>
      {children}
    </div>
  );
}
