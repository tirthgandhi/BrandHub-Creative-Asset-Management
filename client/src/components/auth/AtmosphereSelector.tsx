import { useAtmosphere } from "../../context/AtmosphereContext";
import type { Preference } from "../../data/themes";

const OPTIONS: { value: Preference; label: string; symbol: string }[] = [
  { value: "auto", label: "Auto", symbol: "⌚" },
  { value: "morning", label: "Morning", symbol: "◒" },
  { value: "afternoon", label: "Afternoon", symbol: "☀" },
  { value: "sunset", label: "Sunset", symbol: "◓" },
  { value: "night", label: "Night", symbol: "☾" },
];

export function AtmosphereSelector() {
  const { preference, select } = useAtmosphere();
  const current = OPTIONS.find((o) => o.value === (preference === "auto" ? "auto" : preference));

  return (
    <label className="sky-theme-pill" title="Switch atmosphere">
      <span className="sky-theme-pill__symbol" aria-hidden="true">
        {preference === "auto" ? "⌚" : current?.symbol ?? "☀"}
      </span>
      <select
        className="sky-theme-pill__select"
        value={preference}
        onChange={(e) => select(e.target.value as Preference)}
        aria-label="Atmosphere theme"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.symbol} {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
