// Test-only loader for the exact TypeScript sources, using the pinned compiler.
import {readFileSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const root=resolve('src'),cache=new Map(),native=createRequire(import.meta.url);
export function source(name){
 const file=resolve(root,name.endsWith('.ts')?name:name+'.ts');
 if(relative(root,file).startsWith('..'))throw new Error('SOURCE_PATH_REQUIRED');
 if(cache.has(file))return cache.get(file).exports;
 const loaded={exports:{}};cache.set(file,loaded);
 const compiled=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const require=id=>id.startsWith('@/')?source(id.slice(2)):id.startsWith('.')?source(relative(root,resolve(dirname(file),id))):native(id);
 new Function('require','module','exports',compiled)(require,loaded,loaded.exports);
 return loaded.exports;
}
