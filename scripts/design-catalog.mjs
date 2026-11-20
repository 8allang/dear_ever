import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
export function loadDesignCatalog(root){
 const catalog=JSON.parse(readFileSync(resolve(root,'designs/catalog.json'),'utf8'));
 if(catalog.version!==1||!Array.isArray(catalog.templates)||!catalog.templates.length||catalog.templates.length>30)throw Error('Invalid design catalog');
 const seen=new Set(),templates=[],styles=[];
 for(const id of catalog.templates){
  if(typeof id!=='string'||!/^[a-z][a-z0-9-]{1,59}$/.test(id)||seen.has(id))throw Error('Invalid or duplicate design ID');seen.add(id);
  const item=JSON.parse(readFileSync(resolve(root,'designs',id+'.json'),'utf8'));
  if(item.id!==id||!Number.isInteger(item.version)||item.version<1||typeof item.name!=='string'||!item.name||item.name.length>40||typeof item.description!=='string'||item.description.length>160||!['lace','butter','rose'].includes(item.legacyTheme)||Object.keys(item).some(k=>!['id','version','name','description','legacyTheme'].includes(k)))throw Error('Invalid design metadata: '+id);
  const css=readFileSync(resolve(root,'designs',id+'.css'),'utf8');
  if(/<\/style|@import|url\s*\(|@/i.test(css))throw Error('Design CSS must be self-contained without external assets: '+id);
  for(const rule of css.matchAll(/([^{}]+)\{[^{}]*\}/g))for(const selector of rule[1].split(','))if(selector.trim().match(/^\.design-([a-z0-9-]+)/)?.[1]!==id)throw Error('Design CSS must be scoped to .design-'+id);
  templates.push(item);styles.push(css);
 }
 return {templates,css:styles.join('\n')};
}
