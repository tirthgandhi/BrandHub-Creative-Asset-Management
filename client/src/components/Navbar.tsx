import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { themes, themeCopy, type Preference, type Theme } from "../data/themes";
type Props = {
  theme: Theme;
  preference: Preference;
  select: (value: Preference) => void;
};
export function Navbar({ theme, preference, select }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("experience");
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 40);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        }),
      { rootMargin: "-15% 0px -50% 0px" },
    );
    ["experience", "vision", "showcase"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", scroll);
      observer.disconnect();
    };
  }, []);
  return (
    <header
      className={`navbar ${scrolled ? "scrolled" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <nav
        className={`nav-links ${open ? "is-open" : ""}`}
        id="main-navigation"
        aria-label="Main navigation"
      >
        {[
          ["experience", "Experience"],
          ["vision", "The Vision"],
          ["showcase", "Showcase"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={active === id ? "location" : undefined}
            onClick={() => setOpen(false)}
          >
            {label}
          </a>
        ))}
      </nav>
      <a href="#experience" aria-label="BRANDHUB home" className="nav-brand">
        <BrandLogo />
      </a>
      <div className="nav-actions">
        <label className="theme-select">
          <span aria-hidden="true">{themeCopy[theme].symbol}</span>
          <span className="sr-only">Atmosphere</span>
          <select
            aria-label="Atmosphere"
            value={preference}
            onChange={(e) => select(e.target.value as Preference)}
          >
            <option value="auto">Auto</option>
            {themes.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <a className="nav-cta" href="#showcase">
          Explore BRANDHUB <ArrowUpRight size={15} />
        </a>
        <button
          className="menu-toggle"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
