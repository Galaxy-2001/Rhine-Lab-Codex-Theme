import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildRibbon,sample,totalLength} from '../scripts/ribbon-geometry.mjs';
test('flattening removes all depth while roll changes geometry and surface lighting',()=>{
 const folded=buildRibbon(0,1), turned=buildRibbon(Math.PI/2,1), flat=buildRibbon(0,0);
 assert.equal(folded.length,832);
 assert(flat.every(f=>f.vertices.every(v=>v[2]===0)));
 assert(folded.some((f,i)=>f.d!==turned[i].d && f.color!==turned[i].color));
 assert(folded.some(f=>f.shadow>0));
 assert(new Set(folded.map(f=>f.color)).size>10);
 for(const face of folded) for(const vertex of face.vertices) assert(vertex.every(Number.isFinite));
});
test('centreline closes and remains periodic without a jump',()=>{
 for(const distance of [0,100,500,totalLength-1]){
  const a=sample(distance).p,b=sample(distance+totalLength).p;
  assert(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-8);
 }
 const a=sample(0).p,b=sample(totalLength-1e-5).p;
 assert(Math.hypot(a[0]-b[0],a[1]-b[1])<.1);
});
