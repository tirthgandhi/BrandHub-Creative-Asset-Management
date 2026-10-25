import { ArrowDown, ArrowUpRight, Play, Clapperboard, Image as ImageIcon, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SkyScene } from './SkyScene';
import { themeCopy, type Theme } from '../data/themes';
import { CampaignArtwork } from './CampaignArtwork';
import { heroGallery as gallery } from '../data/gallery';
import { useDepthMotion } from '../hooks/useDepthMotion';
export function Hero({ theme, onFilm }: { theme: Theme; onFilm: () => void }) {
  const ref = useDepthMotion<HTMLElement>();
  return <section ref={ref} id="experience" className="hero hero-dimensional"><SkyScene theme={theme}/>
    <div className="hero-orbit" aria-hidden="true"><div className="orbit-ring"/><div className="orbit-ring ring-two"/>
      <div className="orbit-card orbit-post"><CampaignArtwork item={gallery[0]} chrome priority/><span className="floating-file-label"><ImageIcon size={12}/> summer-launch / post_01</span></div>
      <div className="orbit-card orbit-reel"><CampaignArtwork item={gallery[1]}/><span className="floating-file-label"><Clapperboard size={12}/> skincare / reel_cover</span></div>
      <div className="orbit-card orbit-ad"><CampaignArtwork item={gallery[2]}/></div>
      <div className="orbit-card orbit-kit"><CampaignArtwork item={gallery[3]}/></div>
      <span className="orbit-chip chip-post"><ImageIcon size={15}/> Instagram posts</span><span className="orbit-chip chip-reel"><Clapperboard size={15}/> Reels & stories</span><span className="orbit-chip chip-kit"><Layers size={15}/> Every brand. Every format.</span>
    </div>
    <div className="hero-content"><p className="eyebrow"><span className="live-dot"/> YOUR NEXT CAMPAIGN STARTS HERE</p><h1>Every great idea<br/>deserves a world<br/>of its <em>own.</em></h1><p className="hero-description">From the first Instagram post to the next big campaign.<br className="desktop-break"/> One beautiful space for everything your brand creates.</p><div className="hero-buttons"><Link className="button button-lime" to="/signup">Get started <ArrowUpRight size={18}/></Link><button className="film-link" onClick={onFilm}><span className="play-circle"><Play size={13} fill="currentColor"/></span>Watch the film</button></div></div>
    <div className="hero-bottom"><span>POSTS. REELS. CAMPAIGNS.<br/>ONE CREATIVE UNIVERSE.</span><a href="#vision" className="scroll-cue"><ArrowDown size={17}/> SCROLL INTO YOUR WORLD</a><span className="scene-label">{themeCopy[theme].symbol} {theme.toUpperCase()} SCENE<br/><small>YOUR WORLD, YOUR ATMOSPHERE</small></span></div>
  </section>;
}
