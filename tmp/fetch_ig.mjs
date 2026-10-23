import fs from 'fs';
import path from 'path';

const res = await fetch('https://www.instagram.com/petersonshoes_/embed/', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
  }
});

const html = await res.text();
const startMarker = '"contextJSON":';
const idx = html.indexOf(startMarker);
const endIdx = html.indexOf(',["NavigationMetrics"', idx);
console.log('Around endIdx:', JSON.stringify(html.slice(endIdx - 30, endIdx + 30)));

// Find the exact end of the string literal starting at idx + startMarker.length
let pos = idx + startMarker.length;
// pos should be at '"'
let inEscape = false;
let strEnd = -1;
for (let i = pos + 1; i < html.length; i++) {
  const ch = html[i];
  if (inEscape) {
    inEscape = false;
  } else if (ch === '\\') {
    inEscape = true;
  } else if (ch === '"') {
    strEnd = i + 1;
    break;
  }
}

const jsonStringLiteral = html.slice(pos, strEnd);
const rawJsonStr = JSON.parse(jsonStringLiteral);
const data = JSON.parse(rawJsonStr);

fs.writeFileSync('/tmp/ig_data.json', JSON.stringify(data, null, 2));
const ctx = data.context || {};
console.log('Username:', ctx.username, 'Full name:', ctx.full_name, 'Followers:', ctx.followers_count, 'Posts:', ctx.posts_count);

const outDir = '/app/applet/public/instagram';
fs.mkdirSync(outDir, { recursive: true });

if (ctx.profile_pic_url) {
  const pRes = await fetch(ctx.profile_pic_url);
  fs.writeFileSync(path.join(outDir, 'profile.jpg'), Buffer.from(await pRes.arrayBuffer()));
  console.log('Saved profile.jpg');
}

const media = ctx.graphql_media || [];
console.log('Media count:', media.length);

for (let i = 0; i < media.length; i++) {
  const m = media[i].node || media[i];
  const code = m.shortcode;
  const caption = m.edge_media_to_caption?.edges?.[0]?.node?.text || m.caption || '';
  const displayUrl = m.display_url || m.thumbnail_src;
  const isVideo = m.is_video;
  console.log(`\nPost ${i + 1} (${code}, video=${isVideo}): ${caption.replace(/\n/g, ' | ')}`);

  if (displayUrl) {
    const imgRes = await fetch(displayUrl);
    const filename = `ig_${i + 1}_${code}.jpg`;
    fs.writeFileSync(path.join(outDir, filename), Buffer.from(await imgRes.arrayBuffer()));
    console.log('  Saved:', filename);
  }

  const children = m.edge_sidecar_to_children?.edges || [];
  for (let j = 0; j < children.length; j++) {
    const childUrl = children[j]?.node?.display_url;
    if (childUrl) {
      const cRes = await fetch(childUrl);
      const cFilename = `ig_${i + 1}_${code}_slide_${j + 1}.jpg`;
      fs.writeFileSync(path.join(outDir, cFilename), Buffer.from(await cRes.arrayBuffer()));
      console.log('  Saved slide:', cFilename);
    }
  }
}
