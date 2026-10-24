export const demoMediaCategories = {
  "pexels-alleksana-4271628.jpg": "electronics",
  "pexels-vandana-vankhede-322740014-26733176.jpg": "beauty",
  "pexels-afterave-essentials-2011504051-29107590.jpg": "beauty",
  "pexels-sueda-gln-327513956-28255124.jpg": "beauty",
  "pexels-mehmed-lukavackic-2159281936-36055201.jpg": "fashion",
  "pexels-kampus-7857501.jpg": "shoes",
  "pexels-zaktech90-1027130.jpg": "shoes",
  "pexels-alesiakozik-7797746.jpg": "beauty",
  "pexels-alesiakozik-7796455.jpg": "beauty",
  "pexels-suhashanjar-30970926.jpg": "beauty",
  "mrganso-castle-7254622_1920.jpg": "furniture",
  "bedrck-interior-1961070_1920.jpg": "furniture",
  "clickerhappy-living-room-2732939_1920.jpg": "furniture",
  "erikawittlieb-living-room-2155376_1920.jpg": "furniture",
  "11294-229221031_medium.mp4": "furniture",
  "1006-142621176_medium.mp4": "fashion",
  "10822-226624975_medium.mp4": "electronics",
  "108292-680195115_medium.mp4": "furniture",
  "206029_medium.mp4": "fashion",
  "215500_medium.mp4": "electronics",
  "6322775-uhd_2160_4096_30fps.mp4": "fashion",
  "7125320-uhd_2160_3840_25fps.mp4": "beverages",
  "7311592-uhd_2160_4096_25fps.mp4": "beauty",
  "8075142-uhd_2160_4096_25fps.mp4": "beauty",
  "8935792-uhd_2160_3840_25fps.mp4": "beverages",
  "8942759-uhd_2160_4096_25fps.mp4": "fashion",
};

export function categoryForSource(filename) {
  return demoMediaCategories[filename] || "uncategorized";
}
