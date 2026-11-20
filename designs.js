import {designTemplates} from './design-catalog.js';
export {designTemplates} from './design-catalog.js';
export function resolveDesign(doc){return designTemplates.find(d=>d.id===doc.designId)||designTemplates.find(d=>d.legacyTheme===doc.theme)||designTemplates[0];}
export function applyDesign(doc,id){const design=designTemplates.find(d=>d.id===id);if(!design)throw Error('등록된 디자인만 적용할 수 있어요.');doc.designId=design.id;doc.theme=design.legacyTheme;return design;}
