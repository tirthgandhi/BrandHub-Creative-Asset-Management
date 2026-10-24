import { Construction } from "lucide-react";

export function PlaceholderPage({ title, phase, description }: { title: string; phase: string; description?: string }) {
  return <section><header className="page-heading"><p className="eyebrow">{phase}</p><h1>{title}</h1><p>{description || "This route is ready for its owning phase. No unfinished feature is presented as working."}</p></header><div className="surface-card empty-state"><Construction aria-hidden="true" /><h2>Foundation ready</h2><p>The shared route, navigation, theme, and responsive shell are active.</p></div></section>;
}
