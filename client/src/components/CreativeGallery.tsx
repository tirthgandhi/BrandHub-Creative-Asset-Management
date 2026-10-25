import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  gallery,
  categories,
  type Category,
  type GalleryItem,
} from "../data/gallery";
import { Modal } from "./Modal";
import { CampaignArtwork } from './CampaignArtwork';
export function CreativeGallery() {
  const [category, setCategory] = useState<Category>("All");
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const items = gallery.filter(
    (item) => category === "All" || item.category === category,
  );
  return (
    <section className="section gallery-section" id="showcase">
      <div className="section-top">
        <p className="eyebrow">02 / THE CREATIVE UNIVERSE</p>
        <span className="small-note">
          From feed to final delivery. Every format, considered.
        </span>
      </div>
      <div className="section-heading">
        <h2>
          Made for the feed.
          <br />
          <em>Built for your brand.</em>
        </h2>
        <p>
          Instagram posts. Reel covers. Stories. Campaign launches.
          <br />
          Explore the kind of creative your clients come to you for.
        </p>
      </div>
      <div className="filter-row" aria-label="Filter showcase">
        {categories.map((c) => (
          <button
            key={c}
            className={category === c ? "selected" : ""}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c}
            {c === "All" && <span>16</span>}
          </button>
        ))}
        <span className="gallery-count" aria-live="polite">
          {items.length} VISUAL STORIES
        </span>
      </div>
      <div className="gallery-grid">
        {items.map((item) => (
          <button
            key={item.id}
            className={`gallery-card card-${item.id % 5}`}
            onClick={() => setSelected(item)}
            aria-label={`View ${item.title}`}
          >
            <div className="gallery-image">
              <CampaignArtwork item={item}/>
              <span className="image-open">
                <ArrowUpRight size={18} />
              </span>
            </div>
            <div className="gallery-caption">
              <h3>{item.title}</h3>
              <span>{item.category}</span>
            </div>
          </button>
        ))}
      </div>
      <p className="gallery-footnote">
        Original campaign studies for fictional brands. Select a visual to explore it. Film previews open as playable videos.
      </p>
      {selected && (
        <Modal title={selected.title} close={() => setSelected(null)}>
          <div className="campaign-detail">{selected.videoSrc ? <video src={selected.videoSrc} controls playsInline style={{width:"100%",maxHeight:"70vh"}} /> : <CampaignArtwork item={selected}/>}</div>
          <p className="detail-caption">
            {selected.category} · {selected.format} · Fictional client concept, {selected.brand}
          </p>
        </Modal>
      )}
    </section>
  );
}
