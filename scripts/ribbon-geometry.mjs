// This exact centreline drives both the 3D mesh and the final flat stroke.
export const outline='M552 266 L409.5219 134.4781 A186 186 0 1 0 409.5219 397.5219 L552 266 L695.4781 134.4781 A186 186 0 1 1 695.4781 397.5219 L552 266 Z';
const segments=[];
function line(a,b){const length=Math.hypot(b[0]-a[0],b[1]-a[1]);segments.push({length,at:t=>({p:[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])],tangent:[(b[0]-a[0])/length,(b[1]-a[1])/length]})});}
function arc(cx,start,sweep){segments.push({length:186*Math.abs(sweep),at:t=>{const a=start+sweep*t,s=Math.sign(sweep);return {p:[cx+186*Math.cos(a),266+186*Math.sin(a)],tangent:[-Math.sin(a)*s,Math.cos(a)*s]};}});}
line([552,266],[409.5219,134.4781]);arc(278,-Math.PI/4,-Math.PI*1.5);line([409.5219,397.5219],[552,266]);line([552,266],[695.4781,134.4781]);arc(827,-Math.PI*.75,Math.PI*1.5);line([695.4781,397.5219],[552,266]);
export const totalLength=segments.reduce((sum,s)=>sum+s.length,0);
export function sample(distance){distance=((distance%totalLength)+totalLength)%totalLength;for(const s of segments){if(distance<=s.length)return s.at(distance/s.length);distance-=s.length;}return segments[0].at(0);}
const count=208;
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>a.map(v=>v/Math.hypot(...a));
const light=norm([-.55,-.65,1]),view=norm([-.15,.45,1]),half=norm(light.map((v,i)=>v+view[i]));
const albedo=[.82,.72,.57]; // One warm paper material in linear colour space.
function color(normal,shadow){
 const lambert=Math.max(0,dot(normal,light));
 const specular=.10*Math.max(0,dot(normal,half))**28;
 const illumination=.38+.60*lambert*(1-shadow*.74);
 return '#'+albedo.map(v=>{const linear=v*illumination+specular*(1-shadow);return Math.round(Math.min(1,Math.max(0,linear))**(1/2.2)*255).toString(16).padStart(2,'0');}).join('');
}
// Ray/triangle intersections add occlusion shadows cast by neighbouring
// pleats and the crossing. Colour is never selected by alternating indices.
function rayHits(origin,direction,a,b,c){
 const e1=sub(b,a),e2=sub(c,a),p=cross(direction,e2),det=dot(e1,p);
 if(Math.abs(det)<1e-8)return false;
 const inv=1/det,t=sub(origin,a),u=dot(t,p)*inv;if(u<0||u>1)return false;
 const q=cross(t,e1),v=dot(direction,q)*inv;if(v<0||u+v>1)return false;
 return dot(e2,q)*inv>.15;
}
function node(i,corner,phase,depth){
 const {p,tangent:t}=sample(i/count*totalLength),n=[-t[1],t[0]];
 // Local roll changes real surface normals. Centreline never rotates.
 const angle=(phase+.28*Math.sin(i/count*Math.PI*2))*depth;
 const width=42+(i%2?-2:2)*depth;
 const height=(i%2?9:23)*depth;
 const u=[-width,width,width,-width][corner],z0=[-height,-height,height,height][corner];
 const uRot=u*Math.cos(angle)-z0*Math.sin(angle),zRot=u*Math.sin(angle)+z0*Math.cos(angle);
 const crossing=10*Math.sin(i/count*Math.PI*2)*depth;
 return [p[0]+n[0]*uRot,p[1]+n[1]*uRot,zRot+crossing];
}
const project=p=>[p[0]+p[2]*.15,p[1]-p[2]*.45];
export function buildRibbon(phase,depth){
 const faces=[];
 for(let i=0;i<count;i++)for(let side=0;side<4;side++){
  const next=(side+1)%4;
  const vertices=[node(i,side,phase,depth),node(i,next,phase,depth),node(i+1,next,phase,depth),node(i+1,side,phase,depth)];
  const raw=cross(sub(vertices[1],vertices[0]),sub(vertices[3],vertices[0]));
  const normal=Math.hypot(...raw)>.00001?norm(raw):[0,0,side===2?1:-1];
  const facing=dot(normal,view);
  faces.push({d:vertices.map((p,j)=>(j?'L':'M')+project(p).map(v=>v.toFixed(2)).join(' ')).join(' ')+' Z',visible:facing>0?'1':'0',z:vertices.reduce((s,v)=>s+v[2],0)/4,normal,vertices});
 }
 const lights=[light,norm([-.48,-.65,1]),norm([-.62,-.65,1])];
 for(const face of faces){
  let shadow=0;
  if(depth>0&&face.visible==='1'&&dot(face.normal,light)>0){
   const centre=[0,1,2].map(k=>face.vertices.reduce((s,v)=>s+v[k],0)/4+face.normal[k]*.2);
   for(const direction of lights){
    const hit=faces.some(other=>other!==face&&other.vertices.some(v=>v[2]>centre[2])&&(rayHits(centre,direction,...other.vertices.slice(0,3))||rayHits(centre,direction,other.vertices[0],other.vertices[2],other.vertices[3])));
    if(hit)shadow+=1/lights.length;
   }
  }
  face.shadow=shadow;face.color=color(face.normal,shadow);
 }
 return faces;
}
// One local roll; cross-section depth then contracts to the same 84px stroke.
export const schedule=Array.from({length:13},(_,i)=>({time:Number((i*.0275).toFixed(4)),phase:i/12*Math.PI*2,depth:1}));
schedule.push({time:.385,phase:Math.PI*2,depth:.45},{time:.44,phase:0,depth:0},{time:.88,phase:0,depth:0},{time:1,phase:0,depth:1});
