// Theme artwork as stylesheet rules. The URLs live in CSS keyed by the light /
// dark mode and the motion state, so the renderer only flips attributes and
// never rewrites the multi-megabyte watermark value on <html>.
import {readFileSync} from 'node:fs';
import path from 'node:path';

// UTF-8 data URI, about 25% smaller than base64 for these SVGs. Attribute
// quotes become apostrophes (the assets contain none) and only the characters
// that are unsafe inside url("...") are percent-encoded.
export function svgUrl(svg){
  if(svg.includes("'"))throw new Error('Theme SVG assets must not contain apostrophes.');
  const body=svg.trim().replace(/\s+/g,' ').replaceAll('"',"'").replace(/[%#<>\\]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase().padStart(2,'0'));
  return `url("data:image/svg+xml,${body}")`;
}

export function buildArtCss(assetDir){
  const asset=name=>svgUrl(readFileSync(path.join(assetDir,name),'utf8'));
  const rule=(selector,values)=>`${selector}{${Object.entries(values).map(([name,url])=>`--rhine-${name}:${url}`).join(';')}}`;
  const on='html[data-rhine-enabled="true"]';
  // Order matters: dark still must follow light motion at equal specificity.
  return [
    rule(on,{watermark:asset('watermark-light-still.svg'),grid:asset('grid-light.svg'),ring:asset('ring-light.svg')}),
    rule(`${on}[data-rhine-motion="on"]`,{watermark:asset('watermark-light.svg')}),
    rule(`${on}[data-theme="dark"]`,{watermark:asset('watermark-dark-still.svg'),grid:asset('grid-dark.svg'),ring:asset('ring-dark.svg')}),
    rule(`${on}[data-theme="dark"][data-rhine-motion="on"]`,{watermark:asset('watermark-dark.svg')})
  ].join('\n')+'\n';
}
