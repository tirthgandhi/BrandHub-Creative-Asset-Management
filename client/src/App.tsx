import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTimeTheme } from "./hooks/useTimeTheme";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { CreativeGallery } from "./components/CreativeGallery";
import { FilmSection } from "./components/FilmSection";
import {
  CreativeMarquee,
  VisionSection,
  WorkflowSection,
  ThemeExperience,
  EditorialSection,
  FinalCTA,
  Footer,
} from "./components/StorySections";
import { Modal } from "./components/Modal";
gsap.registerPlugin(ScrollTrigger);
type Credit = {
  name: string;
  source: string;
  license: string;
  provider: string;
};
export default function App() {
  const atmosphere = useTimeTheme();
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<"credits" | null>(null);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [creditsError, setCreditsError] = useState(false);
  useEffect(() => {
    if (reduced) return;
    const context = gsap.context(() => {
      if (matchMedia('(min-width: 768px)').matches) {
        gsap.to('.hero-orbit', { y: -65, ease: 'none', scrollTrigger: { trigger: '.hero-dimensional', start: 'top top', end: 'bottom top', scrub: 1.2 } });
        gsap.to('.volume-left', { y: -90, ease: 'none', scrollTrigger: { trigger: '.hero-dimensional', start: 'top top', end: 'bottom top', scrub: 1.5 } });
        gsap.to('.volume-right', { y: 70, ease: 'none', scrollTrigger: { trigger: '.hero-dimensional', start: 'top top', end: 'bottom top', scrub: 1.5 } });
      }
      gsap.utils
        .toArray<HTMLElement>(
          ".section-heading, .vision-card, .workflow-step, .worlds-section > h2, .editorial-text, .final-cta > h2",
        )
        .forEach((el) => {
          gsap.from(el, {
            y: 35,
            opacity: 0.3,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 95%", once: true },
          });
        });
    }, root);
    return () => context.revert();
  }, [reduced]);
  useEffect(() => {
    if (modal !== "credits") return;
    const controller = new AbortController();
    fetch("/media-manifest.json", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Unavailable");
        return r.json();
      })
      .then(setCredits)
      .catch((e) => {
        if (e.name !== "AbortError") setCreditsError(true);
      });
    return () => controller.abort();
  }, [modal]);
  return (
    <div ref={root} className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar {...atmosphere} />
      <main id="main">
        <div className="sky-journey">
        <Hero theme={atmosphere.theme} />
        <CreativeMarquee />
        <VisionSection />
        </div>
        <CreativeGallery />
        <FilmSection />
        <WorkflowSection />
        <ThemeExperience theme={atmosphere.theme} select={atmosphere.select} />
        <EditorialSection />
        <FinalCTA />
      </main>
      <Footer onCredits={() => setModal("credits")} />
      {modal === "credits" && (
        <Modal title="Behind the imagery" close={() => setModal(null)}>
          <p>
            Campaign artwork and clouds were created with AI for BRANDHUB. Layouts are original fictional client concepts. Atmospheric films are from Mixkit. No customer relationship or endorsement is implied.
          </p>
          <p><a className="text-button" href="/campaign-artwork.json" target="_blank" rel="noreferrer">Original artwork provenance ↗</a></p>
          {creditsError ? (
            <p>
              Credits could not load.{" "}
              <a href="/media-manifest.json">Open the media manifest</a>.
            </p>
          ) : (
            <ul className="credits-list">
              {credits.map((c) => (
                <li key={c.name}>
                  <a href={c.source} target="_blank" rel="noreferrer">
                    {c.name.replaceAll("-", " ")} ↗
                  </a>
                  <a href={c.license} target="_blank" rel="noreferrer">
                    {c.provider} license
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}
