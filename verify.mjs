import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {DEFAULT,THEMES,TRACKS,normalizeProject,buildInvitation,validMedia,safeJSON} from './public/invitation.js';

for(const theme of THEMES){
  for(const standalone of [false,true]){
    const html=buildInvitation({...DEFAULT,theme:theme.id},{standalone});
    assert(html.includes('theme-'+theme.id));
    assert.equal(html.includes('id="cover-screen"'),standalone);
    const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.length,1);
    new Function(scripts[0][1]);
  }
}
const attack='</script><img src=x onerror="alert(1)">';
const hostile=buildInvitation({...DEFAULT,nickname1:attack,story:attack});
assert(!hostile.includes(attack));
assert(!safeJSON({test:attack}).includes('<'));
const cleaned=normalizeProject({...DEFAULT,accent:'red;display:none',cover:'javascript:alert(1)',gallery:['https://attacker.example/track.gif'],volume:500,font:'bad-font'});
assert.equal(cleaned.accent,DEFAULT.accent);assert.equal(cleaned.cover,DEFAULT.cover);assert.deepEqual(cleaned.gallery,[]);assert.equal(cleaned.volume,100);assert.equal(cleaned.font,DEFAULT.font);
assert(!validMedia('data:image/svg+xml;base64,PHN2Zz4=','image'));
assert(!buildInvitation(DEFAULT).includes('id="rsvp-open"'));
assert(buildInvitation({...DEFAULT,phone:'081234567890'}).includes('id="rsvp-open"'));
assert(!buildInvitation({...DEFAULT,musicEnabled:false}).includes('<audio'));
assert(!buildInvitation({...DEFAULT,showStory:false,showGallery:false,showCountdown:false}).includes('id="story"'));
assert(!buildInvitation({...DEFAULT,animation:'none'}).includes('class="petals"'));
const sources=[DEFAULT.cover,...DEFAULT.gallery,...TRACKS.map(t=>t.src),'assets/dm-sans.ttf','assets/cormorant.ttf','assets/cormorant-italic.ttf'];
for(const source of sources)assert(existsSync('public/'+source),'Missing '+source);
const html=readFileSync('public/index.html','utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!match[1].includes(':'))assert(existsSync('public/'+match[1]),'Missing '+match[1]);}
console.log('PASS: 8 invitation variants, inline scripts, input escaping, import validation, RSVP, music, sections, and local assets.');
if(process.argv[2]){
  const exported=readFileSync(process.argv[2],'utf8');
  for(const match of exported.matchAll(/<(?:img|audio)[^>]*src="([^"]+)"/g))assert(match[1].startsWith('data:'),'Media was not embedded');
  assert(!exported.includes("url('assets/"),'Font was not embedded');
  assert(exported.includes('SIL OPEN FONT LICENSE'),'Missing font license');
  assert(exported.includes('id="cover-screen"'));
  for(const script of exported.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(script[1]);
  console.log('PASS: actual downloaded HTML embeds all media, fonts, and licenses; standalone script parses.');
}
