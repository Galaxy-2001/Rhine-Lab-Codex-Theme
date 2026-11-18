// Shared artwork for the approved Pioneer terminal design (2026-10-29).
// Decorative paint only: no images from the reference screenshot are shipped.
// DeepSeek Harness has its own generator in dsh/scripts; this one writes Codex.
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

if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename)){
  const out=resolve(import.meta.dirname,'../runtime/assets');mkdirSync(out,{recursive:true});
  for(const [mode,p]of [['light',pioneer.light],['dark',pioneer.dark]]){
    writeFileSync(resolve(out,`grid-${mode}.svg`),grid(p));
    writeFileSync(resolve(out,`ring-${mode}.svg`),ring(p));
  }
  console.log('Generated Pioneer grid tile and right-edge ruler.');
}
