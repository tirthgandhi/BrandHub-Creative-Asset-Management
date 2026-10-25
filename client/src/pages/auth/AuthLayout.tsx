import { BrandWatermark } from "../../components/branding/BrandWatermark";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../../components/BrandLogo";
import { AtmosphereBackground } from "../../components/auth/AtmosphereBackground";
import { AtmosphereSelector } from "../../components/auth/AtmosphereSelector";

interface AuthLayoutProps {
  children: ReactNode;
  /** Shown above the page <h1> */
  eyebrow?: string;
  /** The main page heading */
  title: string;
  /** Subtitle below heading */
  subtitle?: string;
  /** Show or hide the back-to-home link */
  showHomeLink?: boolean;
}

export function AuthLayout({
  children,
  eyebrow,
  title,
  subtitle,
  showHomeLink = true,
}: AuthLayoutProps) {
  return (
    <div className="sky-auth-layout">
      {/* Full-screen animated sky */}
      <AtmosphereBackground />
      <BrandWatermark />

      {/* Fixed top bar */}
      <header className="sky-auth-header">
        <Link to="/" aria-label="BRANDHUB home" className="sky-auth-brand">
          <BrandLogo />
        </Link>
        <AtmosphereSelector />
      </header>

      {/* Centered card area */}
      <main className="sky-auth-main" id="auth-main">
        <div className="sky-auth-card sg-card">
          {eyebrow && <p className="sky-auth-eyebrow">{eyebrow}</p>}
          <h1 className="sky-auth-title">{title}</h1>
          {subtitle && <p className="sky-auth-subtitle">{subtitle}</p>}
          <div className="sky-auth-body">{children}</div>
        </div>

        {showHomeLink && (
          <p className="sky-auth-back">
            <Link to="/" className="sky-auth-back-link">← Back to home</Link>
          </p>
        )}
      </main>
    </div>
  );
}
