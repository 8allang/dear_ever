import {labels,fields,newDocument,section,addPhoto,normalizeDocumentPhotos,galleryPhotos} from './content.js';
import {renderInvitation} from './render.js';
import {encryptDocument,publicDocument,validateDocument} from './vault.js';
import {loadDraft,saveDraft,createDraftSaver} from './draft-store.js';
const $=s=>document.querySelector(s);
let current={document:newDocument()},selected=null,dirty=false;
const autosave=createDraftSaver(saveDraft,(state,error)=>{dirty=state!=='saved';$('#save-status').textContent=state==='saving'?'저장 중…':state==='saved'?'자동 저장됨':'자동 저장 실패 · '+error.message;});
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,4000);}
function errorAction(fn){return async(...args)=>{try{await fn(...args);}catch(e){toast(e.message);}};}
function changed(){dirty=true;renderPreview();autosave.save(current.document);}
function renderPreview(){renderInvitation($('#preview'),current.document,{preview:true});}
function refresh(){renderStructure();renderForm();renderPreview();}
function deleteSection(id){
 const sections=current.document.sections,index=sections.findIndex(s=>s.id===id);
 if(index<0)return;
 if(sections.length===1){toast('최소 한 페이지는 남겨주세요.');return;}
 if(!confirm('“'+labels[sections[index].type]+'” 페이지를 삭제할까요? 페이지 구성만 삭제되며 사진은 보관함에 남습니다.'))return;
 normalizeDocumentPhotos(current.document);
 sections.splice(index,1);
 if(selected===id)selected=sections[Math.min(index,sections.length-1)].id;
 changed();renderStructure();renderForm();toast('페이지를 삭제했어요. 사진은 보관함에 남아 있어요.');
}
function renderStructure(){const list=$('#section-list');list.replaceChildren();$('#section-count').textContent=current.document.sections.length+'개';for(const [i,s]of current.document.sections.entries()){
 const row=node('div',undefined,'section-row'+(selected===s.id?' active':''));const choose=node('button',undefined,'section-select');choose.append(node('span',String(i+1).padStart(2,'0'),'row-number'),node('span',labels[s.type]));if(!s.enabled)choose.append(node('small','숨김'));choose.onclick=()=>{selected=s.id;renderStructure();renderForm();};
 const controls=node('div',undefined,'row-controls');for(const [name,delta,symbol]of [['위로 이동',-1,'↑'],['아래로 이동',1,'↓']]){const b=node('button',symbol);b.type='button';b.setAttribute('aria-label',labels[s.type]+' '+name);b.disabled=i+delta<0||i+delta>=current.document.sections.length;b.onclick=()=>{const arr=current.document.sections;[arr[i],arr[i+delta]]=[arr[i+delta],arr[i]];changed();renderStructure();};controls.append(b);}
 const remove=node('button','삭제','section-remove');remove.type='button';remove.setAttribute('aria-label',labels[s.type]+' 페이지 삭제');remove.disabled=current.document.sections.length===1;remove.onclick=()=>deleteSection(s.id);controls.append(remove);row.append(choose,controls);list.append(row);
 }}
function inputField(form,label,value,oninput,{type='text',multiline=false,max=4000}={}){const l=node('label',label);const input=node(multiline?'textarea':'input');input.type=type;input.value=value||'';input.maxLength=max;if(multiline)input.rows=5;input.oninput=()=>{oninput(input.value);changed();};l.append(input);form.append(l);return input;}
function selectField(form,label,value,options,onchange){const l=node('label',label),select=node('select');for(const [v,text]of options){const o=node('option',text);o.value=v;select.append(o);}select.value=value;select.onchange=()=>{onchange(select.value);changed();};l.append(select);form.append(l);}
function renderPhotoLibrary(form,doc,page=null){
 const library=node('section',undefined,'photo-library');library.append(node('h3','사진 보관함 · '+(doc.photos?.length||0)+'장'),node('p',page?'보관한 사진을 이 페이지에 다시 담을 수 있어요.':'페이지를 삭제해도 이곳의 사진은 남아요. 사진 페이지에서 다시 선택할 수 있어요.','field-hint'));
 const grid=node('div',undefined,'upload-thumbs');
 for(const [i,photo]of (doc.photos||[]).entries()){
  const item=node('div'),img=node('img');img.src=photo.src;img.alt='보관한 사진 '+(i+1);item.append(img);
  if(page){const included=page.data.photoIds.includes(photo.id),choose=node('button',included?'사용 중':'이 페이지에 담기');choose.type='button';choose.disabled=included;choose.onclick=()=>{if(page.data.photoIds.length>=10){toast('페이지당 최대 10장까지 담을 수 있어요.');return;}page.data.photoIds.push(photo.id);changed();renderForm();};item.append(choose);}
  grid.append(item);
 }
 library.append(grid);form.append(library);
}
function renderForm(){const form=$('#section-form');form.replaceChildren();const doc=current.document;const s=doc.sections.find(s=>s.id===selected);$('#form-title').textContent=s?labels[s.type]:'기본 정보 · 디자인';
 if(!s){inputField(form,'청첩장 이름',doc.title,v=>doc.title=v,{max:80});const pair=node('div',undefined,'field-pair');inputField(pair,'신랑 이름',doc.partner1,v=>doc.partner1=v,{max:40});inputField(pair,'신부 이름',doc.partner2,v=>doc.partner2=v,{max:40});form.append(pair);inputField(form,'예식 날짜 · 시간 (한국 시간)',doc.date,v=>{if(v)doc.date=v;},{type:'datetime-local'});selectField(form,'편지의 분위기',doc.theme,[['lace','Lace · 아이보리 레이스'],['butter','Butter · 버터빛 편지'],['rose','Rose · 로즈 페이퍼']],v=>doc.theme=v);form.append(node('p','이름과 날짜는 표지와 달력에 함께 반영돼요. 페이지별 배경은 각 페이지에서 바꿀 수 있어요.','field-hint'));renderPhotoLibrary(form,doc);return;}
 const toggle=node('label','이 페이지 공개하기','toggle-label'),check=node('input');check.type='checkbox';check.checked=s.enabled;check.onchange=()=>{s.enabled=check.checked;changed();renderStructure();};toggle.prepend(check);form.append(toggle);
 selectField(form,'페이지 스타일',s.style,[['paper','심플한 종이'],['tint','부드러운 색감'],['frame','레이스 프레임']],v=>s.style=v);
 for(const [key,label]of Object.entries(fields[s.type]))inputField(form,label,s.data[key],v=>s.data[key]=v,{multiline:['body','family','transport','groom','bride'].includes(key)});
 if(s.type==='rsvp')form.append(node('p','시트 링크 대신 응답 접수용 Apps Script 주소를 넣어주세요. 연결 전에도 버튼을 눌러 입력창을 미리볼 수 있어요.','field-hint'));
 if(s.type==='gallery'){
  s.data.photoIds||=[];
  const upload=node('label','새 사진 추가 (페이지당 최대 10장)'),input=node('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.multiple=true;upload.append(input);form.append(upload,node('p','사진을 올리면 보관함에도 함께 저장돼요. 페이지에서 빼거나 페이지를 삭제해도 사진은 보관됩니다.','field-hint'));
  input.onchange=errorAction(async()=>{
   const files=[...input.files];if(s.data.photoIds.length+files.length>10)throw Error('사진은 페이지당 최대 10장까지 추가할 수 있어요.');
   try{for(const file of files){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw Error('20MB 이하 JPG, PNG, WebP 파일을 선택해주세요.');
    const bitmap=await createImageBitmap(file);const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const data=canvas.toDataURL('image/jpeg',.78);if(data.length>1500000)throw Error('사진 용량이 큽니다. 더 작은 사진을 선택해주세요.');
    const id=addPhoto(doc,data);if(!s.data.photoIds.includes(id))s.data.photoIds.push(id);
   }}finally{changed();renderForm();}
  });
  const thumbs=node('div',undefined,'upload-thumbs');galleryPhotos(doc,s).forEach((photo,i)=>{const item=node('div'),img=node('img');img.src=photo.src;img.alt='페이지 사진 '+(i+1);const remove=node('button','페이지에서 빼기');remove.type='button';remove.onclick=()=>{s.data.photoIds=s.data.photoIds.filter(id=>id!==photo.id);changed();renderForm();};item.append(img,remove);thumbs.append(item);});form.append(thumbs);
  renderPhotoLibrary(form,doc,s);
 }

 const del=node('button','이 페이지 삭제','delete-button');del.type='button';del.disabled=doc.sections.length===1;del.onclick=()=>deleteSection(s.id);form.append(del);
}

$('#basic-open').onclick=()=>{selected=null;renderStructure();renderForm();};
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$('#'+b.dataset.close).close();
$('#add-open').onclick=()=>$('#add-dialog').showModal();
for(const [type,label]of Object.entries(labels)){const b=node('button',undefined,'block-option');b.append(node('span','✧'),node('strong',label));b.onclick=()=>{if(current.document.sections.length>=30){toast('최대 30페이지까지 구성할 수 있어요.');return;}const s=section(type);current.document.sections.push(s);selected=s.id;changed();renderStructure();renderForm();$('#add-dialog').close();};$('#block-picker').append(b);}
function openExport(){$('#export-status').textContent='';$('#export-dialog').showModal();}
$('#export').onclick=openExport;$('#export-bottom').onclick=openExport;
$('#export-mode').onchange=()=>{const encrypted=$('#export-mode').value==='encrypted';$('#password-fields').hidden=!encrypted;$('#export-password').required=encrypted;$('#export-confirm').required=encrypted;$('#export-warning').textContent=encrypted?'보호된 청첩장은 비밀번호가 있어야 열 수 있어요. 링크와 비밀번호는 따로 전달해주세요.':'이름·사진·계좌 등 입력한 내용과 보관 사진이 공개됩니다.';};
$('#export-form').onsubmit=async e=>{
 e.preventDefault();const button=$('#export-submit');button.disabled=true;$('#export-status').textContent='파일을 만들고 있어요…';
 try{
  const doc=validateDocument(structuredClone(current.document)),encrypted=$('#export-mode').value==='encrypted';
  if(encrypted&&$('#export-password').value!==$('#export-confirm').value)throw Error('비밀번호가 서로 다릅니다.');
  if(!encrypted&&!confirm('이름·계좌·보관 사진을 포함한 내용을 누구나 열 수 있는 청첩장으로 저장할까요?')){$('#export-status').textContent='';return;}
  const file=encrypted?await encryptDocument(doc,$('#export-password').value):publicDocument(doc);
  await autosave.flush();
  const payload=JSON.stringify(file).replace(/</g,'\\u003c');if(payload.length>25000000)throw Error('청첩장 용량이 너무 큽니다. 사진 크기를 줄여주세요.');
  const html=invitationHtmlTemplate.replace('<body class="guest-body">','<body class="guest-body"><script id="invitation-data" type="application/json">'+payload+'</'+'script>');
  const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),link=node('a');link.href=url;link.download='index.html';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  $('#export-status').textContent='공개용 청첩장을 저장했어요. 받은 index.html을 GitHub Pages에 올려주세요.';$('#export-password').value='';$('#export-confirm').value='';

 }catch(error){$('#export-status').textContent=error.message;}finally{button.disabled=false;}
};
$('#section-form').onsubmit=e=>e.preventDefault();
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
try{const saved=await loadDraft();if(saved){const title=saved.title;const restored=validateDocument({...saved,title:typeof title==='string'&&!title.trim()?'작성 중':title});restored.title=title;current={document:restored};}refresh();if(saved)$('#save-status').textContent='자동 저장됨';else autosave.save(current.document);}catch(error){refresh();$('#save-status').textContent='자동 저장을 사용할 수 없습니다. '+error.message;}
