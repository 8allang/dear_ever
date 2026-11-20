import {resolveDesign} from './designs.js';
import {galleryPhotos} from './content.js';
import {openRsvp} from './rsvp.js';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
export function dateText(value){return new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long',hour:'numeric',minute:'2-digit',timeZone:'Asia/Seoul'}).format(new Date(value+'+09:00'));}
export function renderInvitation(root,doc,{preview=false}={}){
 root.replaceChildren(); root.className='invitation theme-'+doc.theme+' design-'+resolveDesign(doc).id;
 const date=new Date(doc.date+'+09:00');
 for(const s of doc.sections.filter(s=>s.enabled)){
  const box=el('section',undefined,'invite-section style-'+s.style+' section-'+s.type); const d=s.data;
  const heading=()=>{box.append(el('span',s.type.toUpperCase(),'eyebrow'),el('h2',d.heading||''));};
  if(s.type==='cover'){
   box.append(el('p',d.eyebrow,'eyebrow'));
   const crest=el('div',undefined,'crest');const flower=el('img');flower.src='./assets/botanical.svg';flower.alt='';flower.setAttribute('aria-hidden','true');crest.append(flower);box.append(crest,el('p','The Wedding of','script'),el('h1',doc.partner1+' & '+doc.partner2),el('div','·','ornament'),el('p',dateText(doc.date)),el('p',d.subtitle,'muted'),el('div','함께할, 모든 날','seal'));

  } else if(s.type==='invitation'||s.type==='notice'||s.type==='closing'){heading();box.append(el('p',d.body,'prose'));if(d.family)box.append(el('p',d.family,'family'));
  } else if(s.type==='calendar'){
   heading();const [year,month,day]=doc.date.slice(0,10).split('-').map(Number);box.append(el('p',`${year}. ${String(month).padStart(2,'0')}. ${day}`,'calendar-title'));
   const grid=el('div',undefined,'calendar');for(const w of ['일','월','화','수','목','금','토'])grid.append(el('span',w,'week'));for(let i=0;i<new Date(Date.UTC(year,month-1,1)).getUTCDay();i++)grid.append(el('span',''));for(let i=1;i<=new Date(Date.UTC(year,month,0)).getUTCDate();i++)grid.append(el('span',String(i),i===day?'selected-day':''));box.append(grid,el('p',dateText(doc.date)));
   const days=Math.ceil((date-Date.now())/86400000);box.append(el('p',days>0?`우리의 결혼식까지 ${days}일`:(days===0?'오늘, 우리 결혼합니다.':'함께해 주셔서 감사합니다.'),'countdown'));
  } else if(s.type==='gallery'){
   heading();const grid=el('div',undefined,'gallery');for(const {src:url} of galleryPhotos(doc,s)){if(!/^data:image\/(jpeg|png|webp);base64,/.test(url))continue;const b=el('button');b.type='button';b.className='photo-button';const img=el('img');img.src=url;img.alt='우리의 웨딩 사진';img.loading='lazy';b.append(img);b.onclick=()=>{const modal=el('dialog',undefined,'lightbox'),full=img.cloneNode();full.loading='eager';const close=el('button','닫기');close.onclick=()=>modal.close();modal.append(close,full);modal.addEventListener('close',()=>modal.remove());document.body.append(modal);modal.showModal();};grid.append(b);}if(!grid.children.length)grid.append(el('div','두 사람의 순간을 이곳에 담아주세요.','photo-placeholder'));box.append(grid);
  } else if(s.type==='location'){
   heading();box.append(el('h3',d.venue),el('p',d.address));const map=el('div',undefined,'map-card');map.append(el('span','⌖','map-pin'),el('p',d.venue));box.append(map);const links=el('div',undefined,'button-row');for(const [name,base] of [['네이버 지도','https://map.naver.com/p/search/'],['카카오맵','https://map.kakao.com/link/search/']]){const a=el('a',name,'soft-button');a.href=base+encodeURIComponent(d.address||d.venue||'');a.target='_blank';a.rel='noopener noreferrer';links.append(a);}box.append(links,el('p',d.transport,'prose'));
  } else if(s.type==='accounts'){
   heading();box.append(el('p','축하의 마음을 전해주시는 모든 분께 감사드립니다.','muted'));for(const [key,label] of [['groom','신랑측'],['bride','신부측']]){if(!d[key])continue;const details=el('details');details.append(el('summary',label),el('p',d[key]));const copy=el('button','계좌 정보 복사','soft-button');copy.onclick=async()=>{try{await navigator.clipboard.writeText(d[key]);copy.textContent='복사했어요';}catch{copy.textContent='위 계좌 정보를 선택해 복사해주세요';}};details.append(copy);box.append(details);}
  } else if(s.type==='contact'){
   heading();for(const [key,label] of [['groom','신랑에게 연락하기'],['bride','신부에게 연락하기']]){const phone=(d[key]||'').replace(/[^+0-9]/g,'');if(phone){const a=el('a',label,'soft-button');a.href='tel:'+phone;box.append(a);}}
  } else if(s.type==='video'){
   heading();if(/^[A-Za-z0-9_-]{11}$/.test(d.youtube||'')){const frame=el('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+d.youtube;frame.title='식전 영상';frame.loading='lazy';frame.allowFullscreen=true;box.append(frame);}else box.append(el('p','영상이 준비되고 있어요.','muted'));
  } else if(s.type==='rsvp'){
   heading();box.append(el('p',d.body));
   const button=el('button','참석 의사 전달','primary rsvp-open-button');button.type='button';button.onclick=()=>openRsvp(d,{preview});box.append(button);

  }
  root.append(box);
 }
 root.append(el('footer','DEAR EVER · 우리의 오래된 약속','invite-footer'));
}
