// Optional authoring helper. Generated HTML runs directly without Node or a server.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const dataUrl=p=>'data:image/svg+xml;base64,'+Buffer.from(read(p)).toString('base64');
const hash=text=>"'sha256-"+createHash('sha256').update(text).digest('base64')+"'";
let viewerHtml;
let css=read('style.css').replaceAll('./assets/lace-edge.svg',dataUrl('assets/lace-edge.svg'));
for(const [name,files]of [['index',['content.js','vault.js','draft-store.js','rsvp.js','render.js','guest.js']],['edit',['content.js','vault.js','draft-store.js','rsvp.js','render.js','editor.js']]]){
 let js=files.map(p=>read(p).replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'')).join('\n');
 if(name==='edit')js='const invitationHtmlTemplate='+JSON.stringify(viewerHtml).replace(/</g,'\\u003c')+';\n'+js;
 js=js.replaceAll('./assets/botanical.svg',dataUrl('assets/botanical.svg'));
 js='(async()=>{\n"use strict";\n'+js+'\n})().catch(error=>{const target=document.querySelector("#invitation")||document.querySelector("#toast");if(target){target.hidden=false;target.textContent="화면을 열지 못했습니다. "+error.message;}});';
 if(/<\/script/i.test(js)||/<\/style/i.test(css))throw Error('Unsafe HTML closing sequence in bundle');
 let html=read('templates/'+name+'.html').replace('<!-- BUNDLE_ENTRY -->','').replace('<link rel="stylesheet" href="./style.css">','<style>'+css+'</style>').replace("script-src 'self'","script-src 'self' "+hash(js)).replace("style-src 'self'","style-src 'self' "+hash(css)).replace('</body>','<script>'+js+'</script></body>');
 if(name==='index')viewerHtml=html;
 writeFileSync(resolve(root,name+'.html'),html);
 console.log(name+'.html generated (standalone CSS and JavaScript)');
}
