import { ThemeSelector } from "../components/ui";

export function SettingsPage() {
  return <section><header className="page-heading"><p className="eyebrow">Preferences</p><h1>Settings</h1><p>Choose how BrandHub appears on this device.</p></header><div className="surface-card settings-card"><h2>Appearance</h2><ThemeSelector /><p className="field-hint">System follows your operating-system setting and updates when it changes.</p></div></section>;
}
