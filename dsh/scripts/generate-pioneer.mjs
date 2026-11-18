// DSH skin source bundles can regenerate these assets independently.
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

export const pioneer={
  light:{surface:'#EEE9DD',panel:'#F6F1E5',sidebar:'#E8E2D3',ink:'#292923',secondary:'#565347',line:'#D5CDBD',soft:'#E2D8C5',accent:'#8B3C1C',orange:'#DC7946',gold:'#D3B45E',blue:'#70A9A5',chrome:'#242722',onChrome:'#F4EFDF'},
  dark:{surface:'#1D2222',panel:'#252B2A',sidebar:'#252B29',ink:'#D7D4C9',secondary:'#AAA99E',line:'#434943',soft:'#383E37',accent:'#E69968',orange:'#C27C53',gold:'#B6A16C',blue:'#79AAA4',chrome:'#151B1B',onChrome:'#DEDBD0'}
};

// The grid is one 44px tile repeated by CSS, so it fills any window at a
// constant, pixel-aligned size. The ruler and rings are a fixed-size piece
// anchored to the right edge. Neither uses <mask>: the animated watermark
// shares their background, and a masked layer is re-rasterised every frame.
export function grid(p){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><path d="M.5 44V.5H44" fill="none" stroke="${p.line}" stroke-opacity=".16"/></svg>\n`;
}
export function ring(p){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="600" viewBox="0 0 140 600"><defs><pattern id="pioneer-ticks" width="9" height="15" patternUnits="userSpaceOnUse"><path d="M0 .5H9" stroke="${p.secondary}"/></pattern></defs><rect x="117" y="0" width="9" height="558" fill="url(#pioneer-ticks)" opacity=".2"/><g fill="none" stroke="${p.line}" opacity=".7"><circle cx="140" cy="470" r="126"/><circle cx="140" cy="470" r="106" stroke-dasharray="3 6"/></g></svg>\n`;
}

if(process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)){
  const out=resolve(import.meta.dirname,'../skins/rhine-lab/assets');
  mkdirSync(out,{recursive:true});
  for(const [mode,p] of Object.entries(pioneer)){
    const station=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 184"><g font-family="Consolas,monospace" font-size="14" letter-spacing="1.6" fill="${p.secondary}"><text x="0" y="22">RHINE LAB / PERSONAL</text><text x="0" y="43">WORKSPACE</text></g><g font-family="Arial,sans-serif" font-size="76" font-weight="900" letter-spacing="-3" fill="${p.ink}"><text x="0" y="124">Terminal</text><text x="0" y="124" transform="translate(0 207) scale(1 -.6)" opacity=".085">Terminal</text></g><path d="M0 181H176" stroke="${p.orange}" stroke-width="6"/><path d="M176 181H288" stroke="${p.gold}" stroke-width="6"/><path d="M288 181H400" stroke="${p.blue}" stroke-width="6"/></svg>\n`;
    writeFileSync(resolve(out,`terminal-${mode}.svg`),station);
    writeFileSync(resolve(out,`grid-${mode}.svg`),grid(p));
    writeFileSync(resolve(out,`ring-${mode}.svg`),ring(p));
  }
}
