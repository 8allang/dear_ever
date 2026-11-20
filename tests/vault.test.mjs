import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encryptDocument,decryptDocument,validateDocument,readPublic,publicDocument} from '../vault.js';
import {newDocument} from '../content.js';
test('JSON round trip: encrypted data hides contents and rejects wrong passwords and tampering',async()=>{
 const doc=newDocument();doc.title='PRIVATE_CANARY_2027';const password='test-only-long-password';
 const a=await encryptDocument(doc,password),b=await encryptDocument(doc,password);
 assert.ok(!JSON.stringify(a).includes(doc.title));assert.notEqual(a.ciphertext,b.ciphertext);assert.notEqual(a.salt,b.salt);assert.notEqual(a.iv,b.iv);
 assert.deepEqual(validateDocument(await decryptDocument(JSON.parse(JSON.stringify(a)),password)),doc);
 await assert.rejects(decryptDocument(a,'wrong-password'));const altered={...a,ciphertext:a.ciphertext.replace(/^./,a.ciphertext[0]==='A'?'B':'A')};await assert.rejects(decryptDocument(altered,password));
 assert.deepEqual(readPublic(publicDocument(doc)),doc);
});
test('untrusted JSON rejects scripts as images, invalid dates, duplicate sections and oversized fields',()=>{
 const doc=newDocument();doc.date='not-a-date';assert.throws(()=>validateDocument(doc));doc.date='2027-05-22T12:30';doc.sections.push({...doc.sections[0]});assert.throws(()=>validateDocument(doc));doc.sections.pop();doc.sections[0].data.eyebrow='x'.repeat(4001);assert.throws(()=>validateDocument(doc));doc.sections[0].data.eyebrow='Hello';doc.sections[0].data.images=['data:image/svg+xml;base64,PHN2Zz4='];assert.throws(()=>validateDocument(doc));
});
