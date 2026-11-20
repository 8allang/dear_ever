import {renderInvitation} from './render.js';
import {decryptDocument,validateDocument,readPublic} from './vault.js';
import {newDocument} from './content.js';
import {loadDraft} from './draft-store.js';
const root=document.querySelector('#invitation'),dialog=document.querySelector('#unlock-dialog');
function show(doc){document.title=doc.partner1+' & '+doc.partner2+' 결혼합니다';renderInvitation(root,doc);}
function showError(error){root.className='loading';root.textContent=error instanceof SyntaxError?'초대장 JSON 파일 형식을 확인해주세요.':error.name==='TimeoutError'?'초대장 파일 응답이 늦어지고 있습니다. 네트워크 연결을 확인한 뒤 새로고침해주세요.':error instanceof TypeError?'초대장 JSON을 불러오지 못했습니다. 인터넷 연결과 invitation.json 파일 업로드 여부를 확인해주세요.':error.message;}
function openEnvelope(file){
 if(!file?.encrypted){show(readPublic(file));return;}
 root.replaceChildren();document.querySelector('#unlock-status').textContent='';dialog.showModal();
 document.querySelector('#unlock-form').onsubmit=async e=>{
  e.preventDefault();const button=document.querySelector('#unlock-submit');button.disabled=true;document.querySelector('#unlock-status').textContent='편지를 여는 중이에요…';
  try{show(validateDocument(await decryptDocument(file,document.querySelector('#unlock-password').value)));document.querySelector('#unlock-password').value='';dialog.close();}catch(error){document.querySelector('#unlock-status').textContent=error.message;}finally{button.disabled=false;}
 };
}
const embedded=document.querySelector('#invitation-data');
if(embedded?.textContent){
 try{openEnvelope(JSON.parse(embedded.textContent));}catch(error){showError(error);}
}else if(location.protocol==='file:'||new URLSearchParams(location.search).get('preview')==='local'){
 try{const saved=await loadDraft();show(saved?validateDocument(saved):newDocument());}catch{show(newDocument());}
 const toolbar=document.createElement('aside');toolbar.className='local-preview-tools';
 const hint=document.createElement('span');hint.textContent='미리보기';
 const link=document.createElement('a');link.href='./edit.html';link.textContent='편집하기';toolbar.append(hint,link);document.body.append(toolbar);
}else{
 try{
  const id=new URLSearchParams(location.search).get('id');if(id&&!/^[a-zA-Z0-9_-]{1,60}$/.test(id))throw Error('올바르지 않은 초대장 주소입니다.');
  const response=await fetch(id?'./invitations/'+id+'.json':'./invitation.json',{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('초대장 파일을 찾을 수 없습니다. 초대자에게 링크를 확인해주세요.');const raw=await response.text();if(raw.length>25000000)throw Error('초대장 파일이 너무 큽니다.');openEnvelope(JSON.parse(raw));
 }catch(error){showError(error);}
}
