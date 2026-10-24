import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "../../components/BrandLogo";
import { ThemeSelector } from "../../components/ui";

export function AuthLayout({ eyebrow, title, intro, children, footer }: { eyebrow: string; title: string; intro: string; children: ReactNode; footer?: ReactNode }) {
  return <main className="auth-layout"><section className="auth-aside"><Link to="/"><BrandLogo /></Link><div><p className="eyebrow">CREATIVE WORK, CLEARLY MANAGED</p><h2>A calmer way to move ideas forward.</h2><p>One secure place for your agency, collaborators, and clients.</p></div><ThemeSelector /></section><section className="auth-panel"><div className="auth-card"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="auth-intro">{intro}</p>{children}{footer ? <div className="auth-footer">{footer}</div> : null}</div></section></main>;
}
