import { ArrowUpRight, ArrowUp, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { themes, themeCopy, type Theme } from "../data/themes";
import { BrandLogo } from "./BrandLogo";
import { CampaignArtwork } from "./CampaignArtwork";
import { gallery } from "../data/gallery";
export function CreativeMarquee() {
  const names = [
    "Instagram Posts",
    "Reels & Stories",
    "Campaign Launches",
    "Brand Identities",
    "Social Carousels",
    "Content Creators",
  ];
  return (
    <section className="marquee-section">
      <p>Made for ideas that won’t stand still.</p>
      <div className="marquee">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div
              className="marquee-set"
              key={copy}
              aria-hidden={copy === 1 ? true : undefined}
            >
              {names.map((n, i) => (
                <span key={n}>
                  <b>{["✳", "◈", "✺", "⌘", "✦", "◎"][i]}</b>
                  {n}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export function VisionSection() {
  return (
    <section id="vision" className="section vision-section">
      <div className="section-top">
        <p className="eyebrow">01 / A LITTLE LESS CHAOS</p>
        <span className="small-note">
          Space for your ideas. Clarity for your vision.
        </span>
      </div>
      <div className="section-heading">
        <h2>
          Less chaos.
          <br />
          <em>More creating.</em>
        </h2>
        <p>
          From the first spark of inspiration to the final
          <br className="desktop-break" /> presentation, give every creative
          idea room to grow.
        </p>
      </div>
      <div className="vision-grid">
        {[
          [
            "Collect",
            "Bring posts, Reel covers, and campaign ideas into one creative direction.",
            "painted-rhythm",
            "A spark can come from anywhere.",
          ],
          [
            "Organize",
            "Keep every client, campaign, and content format beautifully connected.",
            "sculptural-architecture",
            "Find the thread. Follow the feeling.",
          ],
          [
            "Present",
            "Give your clients a clear, considered view of the creative story.",
            "green-horizon",
            "A story worth stepping into.",
          ],
        ].map(([title, desc], i) => (
          <article className={`vision-card vision-${i}`} key={title}>
            <div className="vision-art">
              <div className="vision-deliverable"><CampaignArtwork item={gallery[[0,3,1][i]]} /></div><div className="vision-back-card" aria-hidden="true"/>
              <span className="vision-number">0{i + 1}</span>
              <div className="art-label">
                {i === 0
                  ? "Social content, with direction."
                  : i === 1
                    ? "One campaign. Every format."
                    : "A client-ready creative story."}
                <ArrowUpRight size={18} />
              </div>
              {i === 1 && (
                <div className="collection-tags">
                  <span>POSTS / REELS / STORIES</span>
                  <span>YOUR CLIENT’S NEXT CHAPTER</span>
                </div>
              )}
            </div>
            <div className="vision-copy">
              <h3>
                {title}
                <span>↗</span>
              </h3>
              <p>{desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export function WorkflowSection() {
  return (
    <section className="section workflow-section" id="workflow">
      <div className="workflow-intro">
        <p className="eyebrow">04 / YOUR CREATIVE PROCESS, REIMAGINED</p>
        <h2>
          From inspiration
          <br />
          to <em>impact.</em>
        </h2>
        <p>
          Big ideas rarely arrive fully formed.
          <br />
          Give yours the space to become something.
        </p>
        <a className="text-button" href="#worlds">
          Find your atmosphere <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="workflow-steps">
        {[
          [
            "Discover",
            "Explore creative possibilities through visual collections.",
            "color-study",
            "A fresh point of view.",
          ],
          [
            "Shape",
            "Develop a consistent artistic direction.",
            "soft-geometry",
            "Find your own rhythm.",
          ],
          [
            "Share",
            "Present the finished creative story beautifully.",
            "coastal-story",
            "Put your world out there.",
          ],
        ].map(([title, copy], i) => (
          <article className="workflow-step" key={title}>
            <div className="step-copy">
              <span>0{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </div>
            <div className="workflow-visual">
              <div className="workflow-art-stack"><CampaignArtwork item={gallery[[4,8,6][i]]}/><CampaignArtwork item={gallery[[7,5,15][i]]}/></div><small>ILLUSTRATIVE CLIENT DELIVERABLES / 0{i + 1}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export function ThemeExperience({
  theme,
  select,
}: {
  theme: Theme;
  select: (theme: Theme) => void;
}) {
  return (
    <section className="section worlds-section" id="worlds">
      <p className="eyebrow">05 / A WORLD THAT MOVES WITH YOU</p>
      <h2>
        Creativity looks different
        <br />
        <em>at every hour.</em>
      </h2>
      <p>Find your inspiration from the first light to the last star.</p>
      <div className="worlds-grid">
        {themes.map((t) => (
          <button
            key={t}
            className={`world-card world-${t} ${t === theme ? "active" : ""}`}
            aria-pressed={t === theme}
            onClick={() => select(t)}
          >
            <img src={`/images/themes/${t}.webp`} alt="" loading="lazy" />
            <span className="world-top">
              <span>{themeCopy[t].symbol}</span>
              {t === theme ? (
                <span className="world-selected">
                  <Check size={12} /> CURRENT SCENE
                </span>
              ) : (
                <ArrowUpRight size={18} />
              )}
            </span>
            <span className="world-bottom">
              <small>{themeCopy[t].time}</small>
              <strong>{t}</strong>
              <span>{themeCopy[t].line}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="world-hint">
        Choose a moment. Change the whole atmosphere.
      </p>
    </section>
  );
}
export function EditorialSection() {
  return (
    <section className="editorial-section" aria-labelledby="editorial-heading">
      <div className="editorial-photo editorial-left">
        <CampaignArtwork item={gallery[2]}/>
        <small>MAKE ROOM FOR DIFFERENT.</small>
      </div>
      <div className="editorial-text">
        <p className="eyebrow">THINK BIGGER. FEEL DEEPER.</p>
        <h2 id="editorial-heading">
          Your brand
          <br />
          has a story.
          <br />
          <em>
            Give it space
            <br />
            to shine.
          </em>
        </h2>
      </div>
      <div className="editorial-photo editorial-right">
        <CampaignArtwork item={gallery[1]}/>
      </div>
      <span className="editorial-asterisk" aria-hidden="true">
        ✳
      </span>
    </section>
  );
}
export function FinalCTA() {
  return (
    <section className="final-cta">
      <p className="eyebrow">THE POSSIBILITIES ARE WIDE OPEN</p>
      <h2>
        The next big idea
        <br />
        <em>starts here.</em>
      </h2>
      <p>
        Explore a more beautiful way to think, create,
        <br />
        and bring your brand’s vision together.
      </p>
      <Link to="/signup" className="button button-lime">
        Create your space <ArrowUpRight size={18} />
      </Link>
      <div className="giant-wordmark" aria-hidden="true">
        BRANDHUB
      </div>
    </section>
  );
}
export function Footer({ onCredits }: { onCredits: () => void }) {
  return (
    <footer>
      <div className="footer-top">
        <a href="#experience" aria-label="BRANDHUB home">
          <BrandLogo />
        </a>
        <p>
          One beautiful space for
          <br />
          everything your brand creates.
        </p>
        <nav aria-label="Footer navigation">
          <a href="#vision">The Vision</a>
          <a href="#showcase">Showcase</a>
          <a href="#worlds">The Atmospheres</a>
          <Link to="/login">Sign in</Link>
          <Link to="/signup">Create account</Link>
        </nav>
        <a href="#experience" className="back-top" aria-label="Back to top">
          <ArrowUp size={20} />
        </a>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} BRANDHUB</span>
        <span>An independent creative workspace concept.</span>
        <button onClick={onCredits}>Media credits ↗</button>
      </div>
    </footer>
  );
}
