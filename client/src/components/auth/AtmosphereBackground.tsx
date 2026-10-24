import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useAtmosphere } from "../../context/AtmosphereContext";
import type { Theme } from "../../data/themes";

/** Animated full-screen atmosphere for authentication pages. */
export function AtmosphereBackground() {
  const { theme } = useAtmosphere();
  const reduced = useReducedMotion();
  return (
    <div className="sky-auth-bg" aria-hidden="true" data-reduced={reduced ? "true" : undefined}>
      <SkyLayers theme={theme} />
      <div className="sky-auth-tint" />
      <div className="sky-auth-orb sky-auth-orb--main" />
      <div className="sky-auth-orb sky-auth-orb--secondary" />
      {theme === "night" && <StarField />}
      {!reduced && <CloudLayer theme={theme} />}
      <div className="sky-auth-grain" />
    </div>
  );
}

function SkyLayers({ theme }: { theme: Theme }) {
  const themes: Theme[] = ["morning", "afternoon", "sunset", "night"];
  return (
    <>
      {themes.map((t) => (
        <div
          key={t}
          className={`sky-auth-world sky-auth-world--${t} ${theme === t ? "sky-auth-world--active" : ""}`}
          style={{ backgroundImage: `url(/images/themes/${t}.webp)` }}
        />
      ))}
    </>
  );
}

function StarField() {
  return (
    <div className="sky-auth-stars">
      {Array.from({ length: 60 }).map((_, i) => (
        <span
          key={i}
          className="sky-auth-star"
          style={{
            left: `${(i * 73 + 17) % 100}%`,
            top: `${(i * 41 + 29) % 100}%`,
            width: `${i % 3 + 1}px`,
            height: `${i % 3 + 1}px`,
            animationDelay: `${i % 4}s`,
            animationDuration: `${i % 3 + 2}s`,
          }}
        />
      ))}
    </div>
  );
}

function CloudLayer({ theme }: { theme: Theme }) {
  // Night clouds are very subtle; morning clouds are soft-white
  const opacity = theme === "night" ? 0.12 : theme === "morning" ? 0.55 : theme === "afternoon" ? 0.45 : 0.2;
  return (
    <>
      <div className="sky-auth-cloud sky-auth-cloud--one" style={{ opacity }} />
      <div className="sky-auth-cloud sky-auth-cloud--two" style={{ opacity: opacity * 0.8 }} />
      <div className="sky-auth-cloud sky-auth-cloud--three" style={{ opacity: opacity * 0.6 }} />
    </>
  );
}
