export function getRsvpEndpoint(value){
 try{const u=new URL(value);if(u.protocol==='https:'&&u.hostname==='script.google.com'&&/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname)&&!u.search&&!u.hash&&!u.username&&!u.password)return u.href;}catch{}
 return null;
}
export function openRsvp(data,{preview=false}={}){
 const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const modal=make('dialog',undefined,'rsvp-dialog'),close=make('button','×','dialog-close');close.type='button';close.setAttribute('aria-label','참석 의사 창 닫기');close.onclick=()=>modal.close();
 modal.append(close,make('span','WITH LOVE','eyebrow'),make('h2',data.heading||'참석 의사 전달'),make('p',data.body||'함께해 주실 소중한 걸음을 알려주세요.'));
 const endpoint=getRsvpEndpoint(data.endpoint);
 if(endpoint&&!preview&&location.protocol!=='file:'){
  const frame=make('iframe',undefined,'rsvp-embed');frame.title='참석 의사 입력 및 제출';frame.src=endpoint;frame.referrerPolicy='no-referrer';modal.append(frame);
 }else{
  const form=make('form',undefined,'rsvp-local-form');
  const field=(text,type='text')=>{const label=make('label',text),input=make('input');input.type=type;input.required=true;label.append(input);form.append(label);return input;};
  const name=field('성함');name.maxLength=40;name.autocomplete='name';
  const select=(text,options)=>{const label=make('label',text),input=make('select');for(const [value,title]of options){const option=make('option',title);option.value=value;input.append(option);}label.append(input);form.append(label);return input;};
  select('초대측',[['groom','신랑측'],['bride','신부측']]);
  const attending=select('참석 여부',[['yes','참석합니다'],['no','마음으로 축하합니다']]);
  const guests=field('본인 포함 인원','number');guests.min=1;guests.max=10;guests.value=1;
  const meal=select('식사 여부',[['yes','식사 예정'],['no','식사하지 않음']]);
  attending.onchange=()=>{guests.disabled=meal.disabled=attending.value==='no';};
  const consentLabel=make('label',undefined,'rsvp-consent'),consent=make('input');consent.type='checkbox';consent.required=true;consentLabel.append(consent,make('span','참석 확인을 위해 성함·참석 여부·인원·식사 여부를 초대자에게 제공하는 데 동의합니다.'));form.append(consentLabel);
  const submit=make('button','입력 미리보기 확인','primary');submit.type='submit';const status=make('p',undefined,'rsvp-feedback');status.setAttribute('role','status');
  form.append(make('p',endpoint?'로컬 테스트 화면입니다. 실제 제출은 GitHub Pages에서 이용해주세요.':'입력창 미리보기입니다. 아직 Google Sheets 접수 주소가 연결되지 않았습니다.','field-hint'),submit,status);
  form.onsubmit=e=>{e.preventDefault();status.textContent='입력을 확인했습니다. 테스트 화면이므로 응답은 저장되지 않았습니다.';};modal.append(form);
 }
 modal.addEventListener('close',()=>modal.remove());document.body.append(modal);modal.showModal();
}
