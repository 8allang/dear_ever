import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {newDocument,addPhoto} from '../content.js';
import {decryptDocument} from '../vault.js';
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.value='';this.files=[];this.hidden=false;this.textContent='';}
 append(...nodes){this.children.push(...nodes);} prepend(...nodes){this.children.unshift(...nodes);} replaceChildren(...nodes){this.children=[...nodes];}
 setAttribute(name,value){this[name]=value;} addEventListener(){} remove(){} click(){return this.onclick?.();} showModal(){this.open=true;} close(){this.open=false;}
}
function memoryDatabase(store){return {open(){const req={};queueMicrotask(()=>{req.result={createObjectStore(){},close(){},transaction(){const tx={objectStore(){return {get(){const r={};queueMicrotask(()=>{r.result=structuredClone(store.value);r.onsuccess?.();});return r;},put(value){queueMicrotask(()=>{store.value=structuredClone(value);tx.oncomplete?.();});}}}};return tx;}};req.onsuccess?.();});return req;}};}
async function load(name,{store={},confirm=()=>true,embedded}={}){
 const html=readFileSync(new URL('../'+name+'.html',import.meta.url),'utf8'),js=html.match(/<script>([\s\S]*?)<\/script>/)[1],css=html.match(/<style>([\s\S]*?)<\/style>/)[1];
 for(const text of [js,css])assert.ok(html.includes("'sha256-"+createHash('sha256').update(text).digest('base64')+"'"));
 assert.ok(!/<script[^>]+src=|<link[^>]+stylesheet/.test(html));
 const nodes=new Map(),body=new Element('body'),document={body,title:'',createElement:tag=>new Element(tag),querySelector:selector=>{if(!nodes.has(selector))nodes.set(selector,new Element());return nodes.get(selector);},querySelectorAll:()=>[]};
 if(embedded)document.querySelector('#invitation-data').textContent=JSON.stringify(embedded);
 let fetches=0;const sandbox={document,indexedDB:memoryDatabase(store),location:{protocol:'file:',search:'',href:'file:///test/'+name+'.html'},crypto:webcrypto,TextEncoder,TextDecoder,URL,URLSearchParams,Blob,structuredClone,btoa,atob,Intl,Date,setTimeout:()=>0,clearTimeout,confirm,window:{addEventListener(){}},fetch:()=>{fetches++;throw Error('No fetch in file mode');}};
 await vm.runInNewContext(js,sandbox);await new Promise(resolve=>setImmediate(resolve));return {nodes,body,document,fetches,store};
}
const descendants=n=>[n,...n.children.flatMap(descendants)];
test('typing saves automatically and is restored in editor and local viewer',async()=>{
 const store={},edit=await load('edit',{store}),form=edit.nodes.get('#section-form');const title=form.children[0].children[0];title.value='자동 저장한 청첩장';title.oninput();await new Promise(resolve=>setImmediate(resolve));assert.equal(store.value.title,title.value);assert.equal(edit.nodes.get('#save-status').textContent,'자동 저장됨');
 const restored=await load('edit',{store});assert.equal(restored.nodes.get('#section-form').children[0].children[0].value,title.value);
 store.value.partner1='자동저장';const viewer=await load('index',{store});assert.equal(viewer.fetches,0);assert.equal(viewer.document.title,'자동저장 & 서연 결혼합니다');
});
test('page deletion preserves saved photos and a new gallery can reuse them',async()=>{
 const doc=newDocument(),src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';const id=addPhoto(doc,src);doc.sections.find(s=>s.type==='gallery').data.photoIds=[id];const store={value:doc};const {nodes}=await load('edit',{store});
 const rows=()=>nodes.get('#section-list').children;const row=rows().find(r=>r.children[1].children.some(n=>n['aria-label']==='사진 갤러리 페이지 삭제'));row.children[1].children.find(n=>n.className==='section-remove').click();await new Promise(resolve=>setImmediate(resolve));assert.equal(store.value.photos[0].src,src);assert.ok(!store.value.sections.some(s=>s.type==='gallery'));
 nodes.get('#block-picker').children.find(n=>n.children.some(c=>c.textContent==='사진 갤러리')).click();descendants(nodes.get('#section-form')).find(n=>n.textContent==='이 페이지에 담기').click();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(store.value.sections.at(-1).data.photoIds,[id]);
});
test('deletion cancellation and final-page guard remain effective',async()=>{
 let accept=false;const {nodes}=await load('edit',{confirm:()=>accept});const rows=()=>nodes.get('#section-list').children,remove=row=>row.children[1].children.find(n=>n.className==='section-remove');remove(rows()[0]).click();assert.equal(rows().length,8);accept=true;while(rows().length>1)remove(rows()[0]).click();assert.equal(remove(rows()[0]).disabled,true);remove(rows()[0]).click();assert.equal(rows().length,1);
});
test('public HTML download embeds the chosen protection and renders without JSON loading',async()=>{
 const edit=await load('edit'),get=s=>edit.document.querySelector(s);get('#export-mode').value='encrypted';get('#export-password').value=get('#export-confirm').value='test-only-long-password';await get('#export-form').onsubmit({preventDefault(){}});const link=edit.body.children.find(n=>n.tagName==='a');assert.ok(link,'HTML download was created');assert.equal(link.download,'index.html');const html=await (await fetch(link.href)).text();const embedded=JSON.parse(html.match(/<script id="invitation-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);assert.equal(embedded.encrypted,true);assert.equal((await decryptDocument(embedded,'test-only-long-password')).title,'우리의 결혼식');const guest=await load('index',{embedded});assert.equal(guest.fetches,0);assert.equal(guest.nodes.get('#unlock-dialog').open,true);
});
test('registered designs apply without changing content, persist and travel with the public HTML',async()=>{
 const doc=newDocument(),before=JSON.stringify({sections:doc.sections,photos:doc.photos,partner1:doc.partner1,date:doc.date}),store={value:doc};
 let edit=await load('edit',{store});
 const pick=(id)=>descendants(edit.nodes.get('#section-form')).find(n=>n['data-design-id']===id);
 assert.equal(descendants(edit.nodes.get('#section-form')).filter(n=>n.className==='design-apply').length,4);
 for(const id of ['butter-letter','rose-bloom','modern-vow']){assert.ok(pick(id));pick(id).click();await new Promise(resolve=>setImmediate(resolve));assert.equal(store.value.designId,id);assert.equal(JSON.stringify({sections:store.value.sections,photos:store.value.photos,partner1:store.value.partner1,date:store.value.date}),before);assert.ok(edit.nodes.get('#preview').className.includes('design-'+id));}
 edit=await load('edit',{store});assert.equal(descendants(edit.nodes.get('#section-form')).find(n=>n['data-design-id']==='modern-vow')['aria-pressed'],'true');
 const get=s=>edit.document.querySelector(s);get('#export-mode').value='public';await get('#export-form').onsubmit({preventDefault(){}});const html=await(await fetch(edit.body.children.find(n=>n.tagName==='a').href)).text();const embedded=JSON.parse(html.match(/<script id="invitation-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);const guest=await load('index',{embedded});assert.equal(embedded.document.designId,'modern-vow');assert.ok(guest.nodes.get('#invitation').className.includes('design-modern-vow'));
});
