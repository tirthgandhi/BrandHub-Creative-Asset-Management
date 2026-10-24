export const categories = ['All', 'Instagram Posts', 'Reel Covers', 'Stories', 'Campaign Ads', 'Brand Kits'] as const;
export type Category = typeof categories[number];
export type Campaign = 'beverage' | 'skincare' | 'footwear' | 'studio';
export type GalleryItem = { id: number; title: string; category: Category; campaign: Campaign; brand: string; headline: string; subline: string; format: string; variant: number; src: string; alt: string };
const rows: [string,Category,Campaign,string,string,string,string][] = [
 ['The summer drop','Instagram Posts','beverage','CITRA','A fresh\nkind of energy.','THE SUMMER DROP','1080 × 1350'],
 ['Your daily glow','Reel Covers','skincare','FORME','A little ritual.\nA lot of glow.','THE EVERYDAY EDIT','1080 × 1920'],
 ['Move your way','Campaign Ads','footwear','OFFGRID','Made to\nmove you.','THE NEXT CHAPTER','1200 × 1500'],
 ['Room to grow','Brand Kits','studio','STUDIO NORTH','Different\nby design.','IDENTITY / VOLUME 01','Brand board'],
 ['Meet your new ritual','Instagram Posts','skincare','FORME','Less routine.\nMore ritual.','MEET YOUR DAILY ESSENTIALS','1080 × 1350'],
 ['Summer, on repeat','Stories','beverage','CITRA','Hello,\nsummer.','FIND YOUR FRESH','1080 × 1920'],
 ['The drop is here','Reel Covers','footwear','OFFGRID','Your next\nmove starts here.','THE DROP / 01','1080 × 1920'],
 ['Small details. Big identity.','Brand Kits','skincare','FORME','Naturally\nconsidered.','COLOUR / TYPE / TEXTURE','Brand board'],
 ['Fresh perspective','Campaign Ads','beverage','CITRA','Make a\nsplash.','A NEW WAVE OF FRESH','1200 × 1500'],
 ['Beyond the feed','Instagram Posts','studio','STUDIO NORTH','Good ideas\ntravel further.','A CREATIVE STUDIO FOR WHAT’S NEXT','1080 × 1080'],
 ['The weekend edit','Stories','footwear','OFFGRID','Out of office.\nInto your own.','THE WEEKEND EDIT','1080 × 1920'],
 ['The glow edit','Campaign Ads','skincare','FORME','Your moment\nto glow.','THE DAILY COLLECTION','1200 × 1500'],
 ['A taste of what’s next','Reel Covers','beverage','CITRA','Fresh\nin motion.','BEHIND THE DROP','1080 × 1920'],
 ['Everyday, elevated','Stories','skincare','FORME','A slower\nkind of Sunday.','TAKE A MOMENT FOR YOU','1080 × 1920'],
 ['Built for the bold','Brand Kits','footwear','OFFGRID','Never\nstand still.','DIRECTION / 2026','Brand board'],
 ['One more step','Instagram Posts','footwear','OFFGRID','Find your\nown rhythm.','NEW SEASON. SAME INSTINCT.','1080 × 1350'],
];
export const gallery: GalleryItem[] = rows.map(([title,category,campaign,brand,headline,subline,format],id) => ({id,title,category,campaign,brand,headline,subline,format,variant:id%3,src:`/images/campaigns/${campaign === 'studio' ? 'beverage' : campaign}.png`,alt:campaign === 'beverage' ? 'Blue beverage can with an orange slice and a splash of water' : campaign === 'skincare' ? 'Peach skincare bottles on stone plinths with a silk ribbon' : campaign === 'footwear' ? 'Cream and orange sneaker suspended against a red studio backdrop' : 'Original typographic studio campaign with geometric shapes'}));
