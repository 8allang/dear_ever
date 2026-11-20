// Local editor drafts stay in this browser. Nothing is uploaded by this module.
let draftDatabase;
function openDraftDatabase(){
 if(!draftDatabase)draftDatabase=new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(Error('이 브라우저에서 자동 저장을 사용할 수 없습니다.'));return;}
  const folder=new URL('.',location.href).pathname;
  const request=indexedDB.open('dear-ever-draft:'+folder,1);
  request.onupgradeneeded=()=>request.result.createObjectStore('drafts');
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>db.close();resolve(db);};
  request.onerror=()=>reject(Error('저장 공간에 접근하지 못했습니다. 브라우저 설정을 확인해주세요.'));
  request.onblocked=()=>reject(Error('다른 편집 창을 닫고 다시 열어주세요.'));
 });
 return draftDatabase;
}
export async function loadDraft(){
 const db=await openDraftDatabase();return new Promise((resolve,reject)=>{
  const tx=db.transaction('drafts','readonly'),request=tx.objectStore('drafts').get('current');
  request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error);tx.onabort=()=>reject(tx.error||Error('저장된 내용을 불러오지 못했습니다.'));
 });
}
export async function saveDraft(document){
 const snapshot=structuredClone(document),db=await openDraftDatabase();return new Promise((resolve,reject)=>{
  const tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(snapshot,'current');
  tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error||Error('자동 저장하지 못했습니다. 저장 공간을 확인해주세요.'));
 });
}
export function createDraftSaver(write,onStatus){
 let pending=null,running=null;
 async function drain(){
  while(pending){const value=pending;pending=null;try{await write(value);}catch(error){pending=pending||value;onStatus('error',error);throw error;}}
  onStatus('saved');
 }
 return {
  save(doc){pending=structuredClone(doc);onStatus('saving');if(!running){running=drain().finally(()=>{running=null;});running.catch(()=>{});}return running;},
  async flush(){if(running)await running;if(pending){running=drain().finally(()=>{running=null;});await running;}}
 };
}
