import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
const assets=resolve(import.meta.dirname,'../skins/rhine-lab/assets');
function placed(svg,attrs){return svg.replace(/<svg\b[^>]*>/,tag=>tag.replace('>',` ${attrs}>`));}
for(const mode of ['light','dark']){
 const identity=placed(readFileSync(join(assets,`identity-${mode}.svg`),'utf8'),'x="360" y="135" width="990" height="215"');
 const watermark=placed(readFileSync(join(assets,`watermark-${mode}.svg`),'utf8'),'data-rhine-central="true" x="540" y="275" width="810" height="492.665"');
 const grid=placed(readFileSync(join(assets,`structure-${mode}.svg`),'utf8').replace('viewBox="0 0 800 740"','viewBox="0 0 1600 1000"'),'x="290" y="80" width="1310" height="920" preserveAspectRatio="none"');
 writeFileSync(join(assets,`background-${mode}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><rect width="1600" height="1000" fill="${mode==='light'?'#ECEDE8':'#11191C'}"/>${grid}${identity}${watermark}</svg>\n`);
}
console.log('Composed DSH central backgrounds with native skin-center controls.');
