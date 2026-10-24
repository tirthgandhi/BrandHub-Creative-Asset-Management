import subprocess,json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[1]
ff=root/'.tmp/python-media/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
for path in (root/'client/public/videos').glob('*.mp4'):
 if '.optimized.' in path.name: continue
 out=path.with_suffix('.optimized.mp4')
 subprocess.run([str(ff),'-y','-i',str(path),'-t','18','-vf','scale=1280:-2','-r','24','-an','-c:v','libx264','-crf','27','-preset','fast','-movflags','+faststart',str(out)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 path.write_bytes(out.read_bytes());out.unlink();print(path.name,path.stat().st_size,flush=True)
image=Image.new('RGB',(1200,630),'#0757a3');draw=ImageDraw.Draw(image)
font='C:/Windows/Fonts/arial.ttf'
draw.text((80,65),'BRANDHUB',font=ImageFont.truetype(font,30),fill='#dfff87')
draw.text((80,180),'Every great idea deserves\na world of its own.',font=ImageFont.truetype(font,65),fill='white',spacing=15)
draw.text((80,490),'One beautiful space for everything your brand creates.',font=ImageFont.truetype(font,24),fill='white')
image.save(root/'client/public/images/social-preview.png')
