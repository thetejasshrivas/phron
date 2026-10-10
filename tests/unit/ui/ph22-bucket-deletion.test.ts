import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,test} from '@jest/globals';
import {BucketDeletion} from '@/components/surfaces/BucketDeletion';
import type {SurfaceData} from '@/contracts/surfaces';
test('reallocation dialog requires one active target, excludes source and explains protected history',()=>{
 const buckets=[{id:'source',name:'Shopping'},{id:'target',name:'Transit'}] as SurfaceData['buckets'];
 const html=renderToStaticMarkup(createElement(BucketDeletion,{bucket:buckets[0]!,buckets,disabled:false,save:async()=>false}));
 expect(html).toContain('<dialog');expect(html).toContain('Required target bucket');expect(html).toContain('value="target"');expect(html).not.toContain('value="source"');
 expect(html).toContain('history is retained');expect(html).toContain('disabled="">Confirm reallocation and deletion');
});
