export const labels={cover:'표지',invitation:'초대의 말',calendar:'예식 달력',gallery:'사진 갤러리',location:'오시는 길',accounts:'마음 전하실 곳',notice:'안내 사항',rsvp:'참석 의사',video:'식전 영상',contact:'연락처',closing:'마지막 인사'};
export const fields={cover:{eyebrow:'상단 문구',subtitle:'하단 문구'},invitation:{heading:'제목',body:'초대 문구',family:'가족 소개'},calendar:{heading:'제목'},gallery:{heading:'제목'},location:{heading:'제목',venue:'예식장 · 홀',address:'주소',transport:'교통 · 주차 안내'},accounts:{heading:'제목',groom:'신랑측 (은행 · 계좌 · 예금주)',bride:'신부측 (은행 · 계좌 · 예금주)'},notice:{heading:'제목',body:'안내 내용'},rsvp:{heading:'제목',body:'안내 문구',endpoint:'Google Sheets 접수 주소 (Apps Script /exec)'},video:{heading:'제목',youtube:'YouTube 영상 ID (11자리)'},contact:{heading:'제목',groom:'신랑 전화번호',bride:'신부 전화번호'},closing:{heading:'제목',body:'감사 인사'}};
export function section(type){return {id:crypto.randomUUID(),type,enabled:true,style:type==='cover'?'frame':'paper',data:{heading:labels[type],...(type==='cover'?{eyebrow:'A LOVE LETTER FROM',subtitle:'소중한 당신을 우리의 시작에 초대합니다.'}:{}),...(type==='invitation'?{body:'서로의 계절에 스며든 두 사람이\n이제 같은 방향을 바라보려 합니다.\n\n함께할 모든 날의 시작에\n소중한 걸음으로 축복해 주세요.',family:'신랑 가족 · 신부 가족'}:{}),...(type==='gallery'?{photoIds:[]}:{}),...(type==='location'?{venue:'예식장 이름을 입력해주세요',address:'예식장 주소를 입력해주세요',transport:'교통편과 주차 안내를 입력해주세요.'}:{}),...(type==='rsvp'?{body:'귀한 걸음 준비하실 수 있도록 참석 여부를 알려주세요.'}:{}),...(type==='closing'?{body:'우리의 첫 페이지를\n함께 채워주셔서 감사합니다.'}:{})}};}
export function newDocument(){return {title:'우리의 결혼식',partner1:'민준',partner2:'서연',date:'2027-05-22T12:30',theme:'lace',photos:[],sections:['cover','invitation','calendar','gallery','location','accounts','rsvp','closing'].map(section)};}

export function addPhoto(doc,src){
 doc.photos||=[];const existing=doc.photos.find(p=>p.src===src);if(existing)return existing.id;
 if(doc.photos.length>=100)throw Error('사진 보관함은 최대 100장까지 보관할 수 있어요.');
 const photo={id:crypto.randomUUID(),src};doc.photos.push(photo);return photo.id;
}
export function normalizeDocumentPhotos(doc){
 doc.photos||=[];
 for(const section of doc.sections){
  if(Array.isArray(section.data.images)){
   section.data.photoIds=[...new Set([...(section.data.photoIds||[]),...section.data.images.map(src=>addPhoto(doc,src))])];
   delete section.data.images;
  }
 }
 return doc;
}
export function galleryPhotos(doc,section){
 return (section.data.photoIds||[]).map(id=>doc.photos?.find(p=>p.id===id)).filter(Boolean);
}
