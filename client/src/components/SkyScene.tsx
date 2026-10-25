import { themes, type Theme } from "../data/themes";
export function SkyScene({ theme }: { theme: Theme }) {
  return (
    <div className="sky-scene" aria-hidden="true">
      {themes.map((t) => (
        <div
          key={t}
          className={`sky-world sky-${t} ${theme === t ? "active" : ""}`}
          style={theme === t ? { backgroundImage: `url(/images/themes/${t}.webp)` } : undefined}
        />
      ))}
      <div className="sky-tint" />
      <div className="sky-orb" />
      <div className="stars" />
      <div className="cloud cloud-one" />
      <div className="cloud cloud-two" />
      <div className="cloud cloud-three" />
      <img className="volume-cloud volume-left" src="/images/campaigns/cloud.png" alt="" />
      <img className="volume-cloud volume-right" src="/images/campaigns/cloud.png" alt="" />
      <img className="volume-cloud volume-far" src="/images/campaigns/cloud.png" alt="" />
      <div className="sky-grain" />
    </div>
  );
}
