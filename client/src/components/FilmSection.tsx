import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Theme } from "../data/themes";
export function FilmPlayer({ scene, label }: { scene: Theme; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) video.pause();
      },
      { threshold: 0.1 },
    );
    observer.observe(video);
    const pause = () => {
      if (document.hidden) video.pause();
    };
    document.addEventListener("visibilitychange", pause);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", pause);
      video.pause();
    };
  }, []);
  return (
    <div className="film-player">
      {failed ? (
        <>
          <img src={`/images/themes/${scene}.webp`} alt={label} />
          <p className="video-fallback">
            This browser couldn’t play the film. Enjoy the still, or{" "}
            <a href={`/videos/${scene}.mp4`} download>
              download the film
            </a>
            .
          </p>
        </>
      ) : (
        <video
          ref={ref}
          controls
          playsInline
          muted
          preload="none"
          poster={`/images/themes/${scene}.webp`}
          aria-label={label}
          onError={() => setFailed(true)}
        >
          <source src={`/videos/${scene}.mp4`} type="video/mp4" />
          Your browser does not support video.
        </video>
      )}
    </div>
  );
}
export function FilmSection({ onFilm }: { onFilm: () => void }) {
  return (
    <section id="films" className="section film-section">
      <div className="section-top">
        <p className="eyebrow">03 / A CHANGE OF PACE</p>
        <span className="small-note">Press play. Let your mind wander.</span>
      </div>
      <div className="section-heading">
        <h2>
          Ideas <em>in motion.</em>
        </h2>
        <button className="text-button" onClick={onFilm}>
          Watch the featured film <ArrowUpRight size={18} />
        </button>
      </div>
      <div className="film-grid">
        <article className="featured-film">
          <FilmPlayer scene="afternoon" label="Open skies — cloud timelapse" />
          <div className="film-caption">
            <h3>Room for the unexpected.</h3>
            <span>01 / OPEN SKIES</span>
          </div>
        </article>
        <div className="supporting-films">
          <article>
            <FilmPlayer
              scene="sunset"
              label="Golden hour — sunset on the coast"
            />
            <div className="film-caption">
              <h3>Chasing the light.</h3>
              <span>02 / GOLDEN HOUR</span>
            </div>
          </article>
          <article>
            <FilmPlayer scene="night" label="After hours — night atmosphere" />
            <div className="film-caption">
              <h3>Beyond the ordinary.</h3>
              <span>03 / AFTER HOURS</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
