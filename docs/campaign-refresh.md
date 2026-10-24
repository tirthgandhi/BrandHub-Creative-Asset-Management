# Client deliverables and dimensional scene refresh

The supplied 2.10-second recording was inspected using four frames sampled at half-second intervals. It shows Air's continuous deep-blue scene, large clouds at the edges, a centered wordmark, and content scrolling through the atmosphere. BRANDHUB now uses those visual principles with original artwork and layouts; no Air graphics or customer logos were copied.

## Changes

- Replaced the generic-photo showcase with 16 fictional client deliverables: Instagram posts, Reel covers, stories, campaign ads, and brand kits.
- Created three original campaign photographs using the built-in image-generation tool: a beverage launch, a skincare collection, and a footwear drop. A fourth generated asset supplies transparent, volumetric cloud edges.
- Built editable React/CSS layouts around those assets, including feed-post chrome, portrait story frames, typography, and brand palettes.
- Added perspective, layered card shadows, pointer-based depth, and scroll parallax. Touch and reduced-motion visitors get stable layouts without pointer effects.
- Extended the atmospheric sky through the marquee and feature section, matching the recording's continuous scene treatment.
- Updated the workflow and editorial sections to show client work rather than unrelated stock photography.

## Artwork

The built-in `image_gen` tool was used. Final project files are in `client/public/images/campaigns/`: `beverage.png`, `skincare.png`, `footwear.png`, and `cloud.png`. Prompt summaries and provenance are in `client/public/campaign-artwork.json`. The gallery's brand names and designs are fictional concepts. Reel covers are labeled as static artwork, not playable completed reels.

## Prompt set

1. **Beverage:** Portrait 4:5 editorial advertising photograph; unbranded cobalt-blue can floating above rippling water, orange slice, frozen droplets, realistic aluminium, sunlit caustics, blue negative space for editable text. No logos, text, watermark, UI, or frame.
2. **Skincare:** Portrait 4:5 premium product photograph; peach serum bottle and cream jar on apricot stone plinths, silk ribbon, small white blossom, directional light and tactile shadows. Upper quarter reserved for text. No labels, logos, or UI.
3. **Footwear:** Portrait 4:5 campaign photograph; unbranded cream/vermilion technical sneaker floating over a red floor, chrome tube, realistic soft shadow, mesh/rubber detail. Upper quarter reserved for text; no recognizable brand symbols.
4. **Cloud:** Wide photorealistic white cumulus cloud on transparency, sunlit billows, cool pale-blue underside, feathered wispy edges. No sky, ground, text, or border.

The original PNGs are retained to preserve image quality and cloud transparency. Existing stock files remain available for attribution and future reuse; the active campaign gallery uses the new artwork.
