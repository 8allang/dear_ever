import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {loadDesignCatalog} from '../scripts/design-catalog.mjs';
import {designTemplates,resolveDesign,applyDesign} from '../designs.js';
test('only catalog designs can be applied; older themes and missing designs get a safe fallback',()=>{
 assert.equal(designTemplates.length,4);assert.equal(resolveDesign({theme:'butter'}).id,'butter-letter');assert.equal(resolveDesign({designId:'retired-template',theme:'rose'}).id,'rose-bloom');assert.throws(()=>applyDesign({},'arbitrary-upload'));const doc={title:'keep',sections:[]};applyDesign(doc,'modern-vow');assert.equal(doc.title,'keep');assert.equal(doc.designId,'modern-vow');
});
test('AI catalog build rejects duplicate IDs, unscoped CSS and external assets',()=>{
 const root=mkdtempSync(join(tmpdir(),'dear-ever-designs-'));try{
 cpSync(resolve('designs'),join(root,'designs'),{recursive:true});assert.equal(loadDesignCatalog(root).templates.length,4);
 writeFileSync(join(root,'designs/catalog.json'),JSON.stringify({version:1,templates:['lace-letter','lace-letter']}));assert.throws(()=>loadDesignCatalog(root));
 writeFileSync(join(root,'designs/catalog.json'),JSON.stringify({version:1,templates:['lace-letter']}));
 writeFileSync(join(root,'designs/lace-letter.css'),'body { color:red }');assert.throws(()=>loadDesignCatalog(root));
 writeFileSync(join(root,'designs/lace-letter.css'),'.design-lace-letter-other { color:red }');assert.throws(()=>loadDesignCatalog(root));
 writeFileSync(join(root,'designs/lace-letter.css'),'.design-lace-letter {background:url(https://example.com/tracker)}');assert.throws(()=>loadDesignCatalog(root));
 }finally{rmSync(root,{recursive:true,force:true});}
});
