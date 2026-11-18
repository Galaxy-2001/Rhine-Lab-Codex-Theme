// Skin Center mounts one backgroundMedia image globally. Keep this backdrop
// static: only the CSS on the empty conversation knows when to animate.
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pioneer, grid, ring} from './generate-pioneer.mjs';

const assets=resolve(import.meta.dirname,'../skins/rhine-lab/assets');
for(const [mode,palette] of Object.entries(pioneer)){
  const tile=grid(palette).trim();
  const ruler=ring(palette).replace('<svg ', '<svg x="1460" y="152" ').trim();
  const background=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000">
<defs>
  <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">${tile}</pattern>
  <linearGradient id="fade" x2="0%" y2="100%">
    <stop stop-color="${palette.surface}"/><stop offset=".3" stop-color="${palette.surface}" stop-opacity="0"/>
    <stop offset=".8" stop-color="${palette.surface}" stop-opacity="0"/><stop offset="1" stop-color="${palette.surface}"/>
  </linearGradient>
</defs>
<rect width="1600" height="1000" fill="${palette.surface}"/>
<rect width="1600" height="1000" fill="url(#grid)"/>
<rect width="1600" height="1000" fill="url(#fade)"/>
${ruler}
</svg>\n`;
  writeFileSync(resolve(assets,`background-${mode}.svg`),background);
}
