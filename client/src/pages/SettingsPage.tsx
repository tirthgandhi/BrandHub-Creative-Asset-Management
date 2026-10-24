import { ThemeSelector } from "../components/ui";

export function SettingsPage() {
  return <section><header className="page-heading"><p className="eyebrow">Preferences</p><h1>Settings</h1><p>Choose the atmosphere for your BrandHub workspace.</p></header><div className="surface-card settings-card"><h2>Appearance</h2><ThemeSelector /><p className="field-hint">Auto follows your local time: Morning, Afternoon, Sunset, and Night.</p></div></section>;
}
