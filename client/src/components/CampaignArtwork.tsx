import { Clapperboard, Layers, Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import type { GalleryItem } from '../data/gallery';
export function CampaignArtwork({ item, chrome = false, priority = false }: { item: GalleryItem; chrome?: boolean; priority?: boolean }) {
  const reel = item.category === 'Reel Covers'; const story = item.category === 'Stories'; const kit = item.category === 'Brand Kits';
  return <div className={`campaign-artwork campaign-${item.campaign} variant-${item.variant} ${reel || story ? 'format-portrait' : ''} ${kit ? 'format-kit' : ''} ${chrome ? 'with-chrome' : ''}`}>
    {chrome && <div className="social-header"><span className="social-avatar">{item.brand.slice(0,1)}</span><span>{item.brand.toLowerCase()}.studio<small>Original campaign concept</small></span><b>···</b></div>}
    <div className="campaign-canvas">
      {item.campaign !== 'studio' && <img src={item.src} alt={item.alt} loading={priority ? 'eager' : 'lazy'} width="1122" height="1402"/>}
      {story && <div className="story-progress" aria-hidden="true"><i/><i/><i/></div>}
      <div className="campaign-brand">{item.brand}<span>®</span></div><div className="campaign-headline">{item.headline}</div>
      {item.campaign === 'studio' && <div className="studio-sculpture" aria-hidden="true"><i/><i/><i/><i/></div>}
      <div className="campaign-subline">{item.subline}</div>
      {reel && <span className="reel-stamp"><Clapperboard size={13}/> REEL COVER</span>}
      {kit && <div className="brand-swatches" aria-label="Brand color palette"><i/><i/><i/><i/><span>AAa<br/><small>THE BRAND SYSTEM</small></span></div>}
      {!reel && !kit && <span className="campaign-edition">0{item.id+1} / CREATIVE STUDY</span>}<div className="artwork-sheen" aria-hidden="true"/>
    </div>
    {chrome && <div className="social-footer" aria-hidden="true"><Heart/><MessageCircle/><Send/><span/><Bookmark/></div>}
    {!chrome && <div className="asset-format"><span>{reel ? <Clapperboard size={11}/> : <Layers size={11}/>} {item.category}</span><span>{item.format}</span></div>}
  </div>;
}
