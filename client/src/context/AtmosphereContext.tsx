/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { themes, type Preference, type Theme } from "../data/themes";
import { themeAt } from "../data/time-theme.mjs";

const STORAGE_KEY = "brandhub-theme";
const LEGACY_KEY = "brandhub-sky-theme";

function readPreference(): Preference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    return themes.includes(saved as Theme) ? saved as Theme : "auto";
  } catch {
    return "auto";
  }
}

type AtmosphereValue = {
  theme: Theme;
  preference: Preference;
  select: (value: Preference) => void;
};

const AtmosphereContext = createContext<AtmosphereValue | null>(null);

export function AtmosphereProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<Preference>(readPreference);
  const [clock, setClock] = useState<Theme>(() => themeAt());
  const theme = preference === "auto" ? clock : preference;

  useEffect(() => {
    const update = () => setClock(themeAt());
    const interval = window.setInterval(update, 15_000);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.skyTheme = theme;
    root.style.colorScheme = theme === "morning" ? "light" : "dark";
  }, [theme]);

  const select = useCallback((value: Preference) => {
    setPreference(value);
    try {
      if (value === "auto") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, value);
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // The in-memory preference still works when storage is unavailable.
    }
  }, []);

  const context = useMemo(() => ({ theme, preference, select }), [theme, preference, select]);
  return <AtmosphereContext.Provider value={context}>{children}</AtmosphereContext.Provider>;
}

export function useAtmosphere() {
  const value = useContext(AtmosphereContext);
  if (!value) throw new Error("useAtmosphere must be used within AtmosphereProvider");
  return value;
}
