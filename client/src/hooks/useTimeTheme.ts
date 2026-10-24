import { useEffect, useState } from "react";
import { themeAt } from "../data/time-theme.mjs";
import { themes, type Preference, type Theme } from "../data/themes";
function saved(): Preference {
  try {
    const value = localStorage.getItem("brandhub-theme");
    return themes.includes(value as Theme) ? (value as Theme) : "auto";
  } catch {
    return "auto";
  }
}
export function useTimeTheme() {
  const [preference, setPreference] = useState<Preference>(saved);
  const [clock, setClock] = useState<Theme>(() => themeAt());
  const target: Theme = preference === "auto" ? clock : preference;
  const [theme, setTheme] = useState<Theme>(target);
  useEffect(() => {
    const update = () => setClock(themeAt());
    const timer = window.setInterval(update, 15000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.src = `/images/themes/${target}.webp`;
    const apply = () => {
      if (!cancelled) setTheme(target);
    };
    image.decode().then(apply, apply);
    return () => {
      cancelled = true;
    };
  }, [target]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  function select(value: Preference) {
    setPreference(value);
    try {
      if (value === "auto") localStorage.removeItem("brandhub-theme");
      else localStorage.setItem("brandhub-theme", value);
    } catch {
      /* Private browsing still supports in-memory preferences. */
    }
  }
  return { theme, preference, select };
}
