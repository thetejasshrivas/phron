import ts from 'typescript';
import {readFileSync,writeFileSync} from 'node:fs';
const files = ['src/components/home/Home.tsx', 'src/components/home/CardLedger.tsx', 'src/components/surfaces/HomeDetails.tsx', 'src/components/surfaces/Manage.tsx', 'src/components/surfaces/Visualize.tsx', 'src/components/surfaces/shared.tsx','src/components/surfaces/BucketDeletion.tsx','src/components/surfaces/RecoveryCard.tsx','src/components/surfaces/ObligationPayments.tsx'];
const controls = [];
for (const file of files) {
 const text = readFileSync(file, 'utf8'); const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
 function walk(node, form = null) {
  const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
  if (opening) {
   const tag = opening.tagName.getText(tree);
   const attrs = Object.fromEntries(opening.attributes.properties.filter(ts.isJsxAttribute).map(a => [a.name.getText(tree), a.initializer?.getText(tree) ?? 'true']));
   if (tag === 'form') form = attrs.onSubmit ?? attrs.action ?? 'UNBOUND FORM';
   if (['button', 'a', 'summary'].includes(tag)) controls.push({ file, line: tree.getLineAndCharacterOfPosition(opening.getStart(tree)).line + 1, tag, attributes: attrs, binding: tag === 'summary' ? 'native details disclosure' : tag === 'a' ? attrs.href ?? 'UNBOUND LINK' : attrs.onClick ?? (attrs.type === '"button"' ? 'UNBOUND BUTTON' : form ?? 'UNBOUND BUTTON') });
  }
  ts.forEachChild(node, child => walk(child, form));
 }
 walk(tree);
}
writeFileSync(new URL('controls.json', import.meta.url), JSON.stringify({ scope: files, controls, unbound: controls.filter(c => c.binding.startsWith('UNBOUND')), limitation: 'Source-level binding inventory, including conditional controls. Not proof that every handler succeeds or a substitute for runtime keyboard/performance testing.' }, null, 2) + '\n');
console.log(`${controls.length} control declarations; ${controls.filter(c=>c.binding.startsWith('UNBOUND')).length} unbound`);if(controls.some(c=>c.binding.startsWith('UNBOUND')))process.exitCode=1;
