// Shared artwork for the approved Pioneer terminal design (2026-10-29).
// Decorative paint only: no images from the reference screenshot are shipped.
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

export const pioneer={
  watermarkOpacity:.16,
  light:{surface:'#EEE9DD',panel:'#F6F1E5',sidebar:'#E8E2D3',ink:'#292923',secondary:'#565347',line:'#D5CDBD',soft:'#E2D8C5',accent:'#8B3C1C',orange:'#DC7946',gold:'#D3B45E',blue:'#70A9A5',chrome:'#242722',onChrome:'#F4EFDF'},
  dark:{surface:'#1D2222',panel:'#252B2A',sidebar:'#252B29',ink:'#D7D4C9',secondary:'#AAA99E',line:'#434943',soft:'#383E37',accent:'#E69968',orange:'#C27C53',gold:'#B6A16C',blue:'#79AAA4',chrome:'#151B1B',onChrome:'#DEDBD0'}
};

const root=resolve(import.meta.dirname,'..');
const destinations=['skins/rhine-lab/assets'];
for(const destination of destinations){
  const out=resolve(root,destination);mkdirSync(out,{recursive:true});
  for(const [mode,p]of [['light',pioneer.light],['dark',pioneer.dark]]){
    const bar=`<path d="M0 94H176" stroke="${p.orange}" stroke-width="4"/><path d="M176 94H288" stroke="${p.gold}" stroke-width="4"/><path d="M288 94H400" stroke="${p.blue}" stroke-width="4"/>`;
    const terminal=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 98"><text x="0" y="12" font-family="Consolas,monospace" font-size="10" letter-spacing="1.4" fill="${p.secondary}">RHINE LAB / PERSONAL WORKSPACE</text><g font-family="Arial,sans-serif" font-size="66" font-weight="900" letter-spacing="-3" fill="${p.ink}"><text x="0" y="72">Terminal</text><text x="0" y="-76" transform="translate(0 45) scale(1 -.5)" opacity=".065">Terminal</text></g>${bar}</svg>\n`;
    const station=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 184"><g font-family="Consolas,monospace" font-size="14" letter-spacing="1.6" fill="${p.secondary}"><text x="0" y="22">RHINE LAB / PERSONAL</text><text x="0" y="43">WORKSPACE</text></g><g font-family="Arial,sans-serif" font-size="76" font-weight="900" letter-spacing="-3" fill="${p.ink}"><text x="0" y="124">Terminal</text><text x="0" y="124" transform="translate(0 207) scale(1 -.6)" opacity=".085">Terminal</text></g><path d="M0 181H176" stroke="${p.orange}" stroke-width="6"/><path d="M176 181H288" stroke="${p.gold}" stroke-width="6"/><path d="M288 181H400" stroke="${p.blue}" stroke-width="6"/></svg>\n`;
    const structure=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 740"><defs><pattern id="pioneer-grid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="${p.line}"/></pattern><pattern id="pioneer-ticks" width="8" height="13" patternUnits="userSpaceOnUse"><path d="M0 0H8" stroke="${p.secondary}"/></pattern><linearGradient id="pioneer-fade" x2="0" y2="1"><stop offset="0" stop-color="black"/><stop offset=".3" stop-color="white"/><stop offset=".8" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="pioneer-mask"><rect width="800" height="740" fill="url(#pioneer-fade)"/></mask></defs><rect width="800" height="740" fill="url(#pioneer-grid)" opacity=".16" mask="url(#pioneer-mask)"/><rect x="782" y="100" width="8" height="485" fill="url(#pioneer-ticks)" opacity=".2"/><g fill="none" stroke="${p.line}" opacity=".7"><circle cx="800" cy="555" r="110"/><circle cx="800" cy="555" r="92" stroke-dasharray="3 5"/></g></svg>\n`;
    for(const still of [false,true]){
      const motion=still?'':'<animateTransform attributeName="transform" type="rotate" from="0 48 52" to="360 48 52" dur="24s" repeatCount="indefinite"/>';
      const instrument=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 104"><style>@media(prefers-reduced-motion:reduce){.orbit{display:none}}</style><path d="M0 1H260M0 103H260" stroke="${p.line}"/><g fill="none" stroke="${p.line}"><circle cx="48" cy="52" r="40" stroke-width="5" stroke-dasharray="1 8"/><circle cx="48" cy="52" r="29"/><circle cx="48" cy="52" r="22"/></g><g class="orbit"><path d="M48 19A33 33 0 0 1 81 52" fill="none" stroke="${p.orange}" stroke-width="2"/><path d="M81 52A33 33 0 0 1 48 85" fill="none" stroke="${p.gold}" stroke-width="2"/>${motion}</g><path d="M39 52H57M48 43V61" stroke="${p.accent}" stroke-width="3"/><g font-family="Consolas,monospace" font-size="9" fill="${p.secondary}"><text x="102" y="25">STRUCTURAL SECTION</text><text x="102" y="84">RHINE · LAB</text></g><g font-family="Arial,sans-serif" font-weight="800" font-size="18" fill="${p.ink}"><text x="102" y="47">RESEARCH</text><text x="102" y="67">IN PROGRESS</text></g></svg>\n`;
      writeFileSync(resolve(out,`terminal-${mode}${still?'-still':''}.svg`),destination.includes('skins/')?station:terminal);
      writeFileSync(resolve(out,`instrument-${mode}${still?'-still':''}.svg`),instrument);
      writeFileSync(resolve(out,`structure-${mode}${still?'-still':''}.svg`),structure);
    }
  }
}
console.log('Generated shared Pioneer terminal, instrument and quiet geometric paint.');
