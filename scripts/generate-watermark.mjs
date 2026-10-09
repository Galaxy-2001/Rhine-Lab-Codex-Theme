// Original reconstruction; no video frames are embedded.
// Reference: https://www.bilibili.com/video/BV1rr4y1b7sz/ (03:50–04:04).
import fs from 'node:fs/promises';
import path from 'node:path';
import {buildRibbon,outline,totalLength,schedule} from './ribbon-geometry.mjs';
const output=path.resolve(import.meta.dirname,'../runtime/assets');
const plus='<g transform="translate(278 266)"><path class="rhine-plus" d="M-79.5 -25.5h54v-54h51v54h54v51h-54v54h-51v-54h-54z"/></g>';
const minus='<g transform="translate(827 266)"><path class="rhine-minus" d="M-72 -25.5h144v51H-72z"/></g>';
const label='<text class="rhine-label" x="559" y="630" text-anchor="middle" font-family="Arial,sans-serif" font-size="56" font-weight="700" letter-spacing="43">RHINE·LAB</text>';
const keyTimes=schedule.map(f=>f.time).join(';');
const frames=schedule.map(f=>buildRibbon(f.phase,f.depth));
const order=frames[0].map((face,index)=>({index,z:face.z})).sort((a,b)=>a.z-b.z).map(f=>f.index);
const paths=order.map(index=>{
 const values=frames.map(f=>f[index]);
 return `<path d="${values[0].d}" fill="${values[0].color}" opacity="${values[0].visible}"><animate attributeName="d" values="${values.map(f=>f.d).join(';')}" keyTimes="${keyTimes}" dur="14s" repeatCount="indefinite"/><animate attributeName="fill" values="${values.map(f=>f.color).join(';')}" keyTimes="${keyTimes}" dur="14s" repeatCount="indefinite"/><animate attributeName="opacity" values="${values.map(f=>f.visible).join(';')}" keyTimes="${keyTimes}" dur="14s" repeatCount="indefinite"/></path>`;
}).join('');
for(const mode of ['light','dark']){
 const flat=mode==='light'?'#FFFFFF':'#E9EDE4';
 const foldOpacity=mode==='light'?'.42':'.12',flatOpacity=mode==='light'?'.70':'.105';
 const flatMark=`<g fill="${flat}"><path d="${outline}" fill="none" stroke="${flat}" stroke-width="84" stroke-linejoin="round" stroke-dasharray="${(totalLength-81).toFixed(4)} 81" stroke-dashoffset="971.5530" class="rhine-ribbon"/>${plus}${minus}${label}</g>`;
 const style=`<style>
@keyframes rhine-fold-visible{0%,34%{opacity:1}45%,88%{opacity:0}100%{opacity:1}}
@keyframes rhine-flat-visible{0%,34%{opacity:0}44%,88%{opacity:1}100%{opacity:0}}
@keyframes rhine-gap{from{stroke-dashoffset:971.5530}to{stroke-dashoffset:${(971.553-totalLength).toFixed(4)}}}
@keyframes rhine-plus-entry{0%,35%{transform:scale(0) rotate(-90deg)}44%,88%{transform:scale(1) rotate(0deg)}100%{transform:scale(0) rotate(-90deg)}}
@keyframes rhine-minus-entry{0%,36%{transform:scale(.008,1)}44%,88%{transform:scale(1,1)}100%{transform:scale(.008,1)}}
@keyframes rhine-label-entry{0%,36%{opacity:0}46%,88%{opacity:1}100%{opacity:0}}
.folded{animation:rhine-fold-visible 14s ease-in-out infinite}
.flat{animation:rhine-flat-visible 14s ease-in-out infinite}
.rhine-ribbon{animation:rhine-gap 6s linear infinite}
.rhine-plus{animation:rhine-plus-entry 14s cubic-bezier(.22,.61,.36,1) infinite;transform-origin:0 0}
.rhine-minus{animation:rhine-minus-entry 14s cubic-bezier(.22,.61,.36,1) infinite;transform-origin:0 0}
.rhine-label{animation:rhine-label-entry 14s ease-out infinite}
@media(prefers-reduced-motion:reduce){.folded{display:none}.flat{animation:none;opacity:1}.rhine-ribbon,.rhine-plus,.rhine-minus,.rhine-label{animation:none;transform:none;opacity:1}}
</style>`;
 const motion=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1118 680" aria-label="Rhine Lab rotating folded ribbon and flat symbol">${style}<defs><filter id="soft-contact" x="-8%" y="-12%" width="116%" height="124%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#67573C" flood-opacity=".24"/></filter></defs><g class="folded"><g opacity="${foldOpacity}" filter="url(#soft-contact)">${paths}</g></g><g class="flat" opacity="0"><g opacity="${flatOpacity}">${flatMark}</g></g></svg>\n`;
 const still=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1118 680"><g opacity="${flatOpacity}">${flatMark.replaceAll(/ class="[^"]+"/g,'')}</g></svg>\n`;
 await fs.writeFile(path.join(output,`watermark-${mode}.svg`),motion);
 await fs.writeFile(path.join(output,`watermark-${mode}-still.svg`),still);
}
console.log('Generated canonical 3D ribbon, normal-based lighting and symbol entry animations.');
