import { Link } from "react-router-dom";
import { Button } from "../components/ui";

export function NotFoundPage() {
  return <main className="standalone-page"><section className="surface-card empty-state"><p className="eyebrow">404</p><h1>That page is out of frame.</h1><p>Check the address or return to BrandHub.</p><Link to="/"><Button>Return home</Button></Link></section></main>;
}
