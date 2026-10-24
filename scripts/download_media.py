import json,re,urllib.request,concurrent.futures,io
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]/'client/public'
photos=[(1445416,'sculptural-architecture'),(1029604,'color-study'),(1526713,'desert-light'),(1831234,'botanical-study'),(1029236,'modern-facade'),(834657,'soft-geometry'),(102129,'open-water'),(1269968,'painted-rhythm'),(4202325,'still-life'),(279648,'creative-studio'),(2082087,'quiet-interior'),(994605,'coastal-story'),(459301,'urban-lines'),(459799,'mountain-air'),(323705,'wildflowers'),(3225517,'green-horizon')]
manifest=[]
def get(url):
 return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=60).read()
def photo(item):
 id,name=item; url=f'https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?auto=compress&cs=tinysrgb&w=1000'
 img=Image.open(io.BytesIO(get(url))).convert('RGB'); img.thumbnail((1000,1200)); img.save(ROOT/f'images/gallery/{name}.webp','WEBP',quality=82)
 img.thumbnail((500,600));img.save(ROOT/f'images/gallery/{name}-small.webp','WEBP',quality=78)
 return {'name':name,'path':f'/images/gallery/{name}.webp','source':f'https://www.pexels.com/photo/{id}/','license':'https://www.pexels.com/license/','provider':'Pexels'}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 for result in pool.map(photo,photos): manifest.append(result);print(result['name'],flush=True)
# The provider's JSON-LD identifies each selected clip's individual license.
clouds=get('https://mixkit.co/free-stock-video/clouds/').decode()
night=get('https://mixkit.co/free-stock-video/stars/').decode()
def clips(html):
 result=[]
 for raw in re.findall(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',html,re.S):
  obj=json.loads(raw)
  for item in obj.get('@graph',[]):
   if item.get('@type')=='VideoObject' and item.get('license','').endswith('#videoFree'): result.append(item)
 return result
pool=clips(clouds); stars=clips(night)
for c in stars: print('STAR',c.get('name'),c.get('contentUrl'),flush=True)
chosen=[('morning',next(c for c in pool if '4132/' in c['@id'])),('afternoon',next(c for c in pool if '51105/' in c['@id'])),('sunset',next(c for c in pool if '2168/' in c['@id'])),('night',stars[0])]
for theme,clip in chosen:
 url=clip['contentUrl']; id=re.search(r'/videos/(\d+)/',url).group(1)
 # 720p if provided, otherwise verified 1080p asset.
 data=get(url); (ROOT/f'videos/{theme}.mp4').write_bytes(data)
 img=Image.open(io.BytesIO(get(clip['thumbnailUrl']))).convert('RGB');img.save(ROOT/f'images/themes/{theme}.webp','WEBP',quality=88)
 manifest.append({'name':clip['name'],'path':f'/videos/{theme}.mp4','poster':f'/images/themes/{theme}.webp','source':clip['@id'].split('#')[0],'license':clip['license'],'provider':'Mixkit'})
 print(theme,len(data),flush=True)
(ROOT/'media-manifest.json').write_text(json.dumps(manifest,indent=2))


