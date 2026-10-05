import fs from 'node:fs/promises';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import TOML from './vendor/smol-toml/index.cjs';

export const keys=['appearanceTheme','appearanceLightChromeTheme','appearanceDarkChromeTheme','appearanceLightCodeThemeId','appearanceDarkCodeThemeId'];
const parse=text=>TOML.parse(text,{integersAsBigInt:'asNeeded'});
function select(document){const out={};for(const key of keys)if(Object.hasOwn(document.desktop??{},key))out[key]=document.desktop[key];return out;}
function unrelated(document){const out={...document,desktop:{...document.desktop}};for(const key of keys)delete out.desktop[key];if(!Object.keys(out.desktop).length)delete out.desktop;return out;}
function atom(value){if(typeof value==='string')return JSON.stringify(value);if(typeof value==='boolean'||typeof value==='number')return String(value);throw new Error('Unsupported appearance value.');}
function table(name,value,newline){let out=`[${name}]${newline}`;for(const [key,v]of Object.entries(value))if(typeof v!=='object')out+=`${key} = ${atom(v)}${newline}`;for(const [key,v]of Object.entries(value))if(typeof v==='object')out+=newline+table(`${name}.${key}`,v,newline);return out;}
export function rewrite(text,target){
  const before=parse(text),newline=text.includes('\r\n')?'\r\n':'\n';
  const scalars=Object.entries(target).filter(([,v])=>typeof v!=='object').map(([k,v])=>`${k} = ${atom(v)}${newline}`).join('');
  const roots=keys.map(key=>`desktop.${key}`);let current='',skip=false,found=false,result='';
  for(const line of text.match(/[^\n]*\n|[^\n]+$/g)??[]){
    const header=/^\s*\[([^\[\]]+)\]\s*(?:#.*)?$/.exec(line.trimEnd());
    if(header){current=header[1].trim();skip=roots.some(root=>current===root||current.startsWith(root+'.'));if(skip)continue;result+=line;if(current==='desktop'){found=true;result+=scalars;}continue;}
    if(skip)continue;
    if(current==='desktop'&&keys.some(key=>new RegExp(`^\\s*${key}\\s*=`).test(line)))continue;
    result+=line;
  }
  if(!found)result+=`${newline}[desktop]${newline}${scalars}`;
  for(const [key,value]of Object.entries(target))if(typeof value==='object')result+=newline+table(`desktop.${key}`,value,newline);
  const after=parse(result);
  const expected=select(parse(TOML.stringify({desktop:target})));
  if(!isDeepStrictEqual(unrelated(before),unrelated(after))||!isDeepStrictEqual(select(after),expected))throw new Error('Appearance edit could not preserve the configuration; no write was performed. Import the supplied JSON themes in Settings > Appearance instead.');
  return result;
}
export async function changeAppearance(action,configPath,stateRoot){
  const receiptPath=path.join(stateRoot,'appearance.json');let receipt;
  try{receipt=JSON.parse(await fs.readFile(receiptPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
  if(action==='restore'&&(!receipt||receipt.restored))return {changed:false};
  if(receipt&&receipt.configPath!==configPath)throw new Error('Appearance configuration location changed.');
  let bytes;try{bytes=await fs.readFile(configPath);}catch(e){if(e.code!=='ENOENT'||action==='restore')throw e;bytes=Buffer.alloc(0);}
  const bom=bytes.subarray(0,3).equals(Buffer.from([239,187,191]));
  const text=new TextDecoder('utf-8',{fatal:true}).decode(bom?bytes.subarray(3):bytes);
  if(text.includes('\0'))throw new Error('Configuration must be UTF-8.');
  const current=select(parse(text));let target;
  if(action==='apply'){
    const light=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'assets/rhine-lab-light.json'),'utf8'));
    const dark=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'assets/rhine-lab-dark.json'),'utf8'));
    target={appearanceTheme:current.appearanceTheme??'light',appearanceLightCodeThemeId:light.codeThemeId,appearanceDarkCodeThemeId:dark.codeThemeId,appearanceLightChromeTheme:light.theme,appearanceDarkChromeTheme:dark.theme};
    receipt={configPath,beforeTOML:receipt&&!receipt.restored?receipt.beforeTOML:TOML.stringify({desktop:current}),afterTOML:TOML.stringify({desktop:target}),restored:false};
  }else if(action==='restore'){
    const original=select(parse(receipt.beforeTOML)),applied=select(parse(receipt.afterTOML));target={...current};
    for(const key of keys)if(isDeepStrictEqual(current[key],applied[key])){if(Object.hasOwn(original,key))target[key]=original[key];else delete target[key];}
    receipt={...receipt,restored:true};
  }else throw new Error('Unknown appearance action.');
  const next=rewrite(text,target);
  await fs.mkdir(stateRoot,{recursive:true});await fs.mkdir(path.dirname(configPath),{recursive:true});
  const unchanged=async()=>{let now;try{now=await fs.readFile(configPath);}catch(e){if(e.code!=='ENOENT')throw e;now=Buffer.alloc(0);}if(!now.equals(bytes))throw new Error('Configuration changed concurrently; retry.');};
  await unchanged();
  const saved=path.join(stateRoot,'backups',`appearance-${Date.now()}.toml`);await fs.mkdir(path.dirname(saved),{recursive:true});await fs.writeFile(saved,bytes,{flag:'wx'});
  const nextBytes=Buffer.concat([bom?Buffer.from([239,187,191]):Buffer.alloc(0),Buffer.from(next)]);
  const temp=configPath+'.rhine-'+process.pid+'.tmp';
  await fs.writeFile(temp,nextBytes,{flag:'wx'});
  if(action==='apply')await fs.writeFile(receiptPath,JSON.stringify(receipt,null,2));
  try{await unchanged();await fs.rename(temp,configPath);}finally{await fs.rm(temp,{force:true});}
  if(action==='restore')await fs.writeFile(receiptPath,JSON.stringify(receipt,null,2));
  return {changed:!bytes.equals(nextBytes),restored:receipt.restored};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){
  const codexHome=process.env.CODEX_HOME||path.join(process.env.USERPROFILE,'.codex');
  console.log(JSON.stringify(await changeAppearance(process.argv[2],process.argv[3]||path.join(codexHome,'config.toml'),process.argv[4]||path.join(process.env.LOCALAPPDATA,'RhineLabTheme7'))));
}
