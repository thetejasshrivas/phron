import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { test,expect } from '@jest/globals';
import { HomeSurface } from '@/components/home/Home';
import { HomeSession, type HomeView } from '@/client/home-session';
import { boundedLevel, bucketPresentation, positiveSpendAmount } from '@/client/home-presentation';
import { encodePaise } from '@/contracts/money';
const session=new HomeSession(fetch,()=>crypto.randomUUID());
test.each(['pending','retry','error','loading','auth','ready'] as const)('component renders meaningful %s feedback without fixture controls',phase=>{
 const view:HomeView={data:null,phase,notice:'Confirmed state retained'};
 const html=renderToStaticMarkup(createElement(HomeSurface,{view,session}));
 expect(html).not.toContain('Preview state');expect(html).not.toContain('Use sample');expect(html).toContain('Confirmed state retained');
 if(phase==='retry')expect(html).toContain('Retry same save');
 if(phase==='auth')expect(html).toContain('/sign-in');
 if(phase==='ready')expect(html).toContain('/onboarding');
});
test('presentation remains exact beyond safe numbers and chart conversion is bounded',()=>{
 const b=bucketPresentation({id:'x',name:'Test',allocation:encodePaise(9007199254740993n),spent:encodePaise(1n)});
 expect(b.remaining).toBe('9007199254740992');expect(b.level).toBe(99.99);
 expect(boundedLevel(encodePaise(-1n),encodePaise(100n))).toBe(0);
 expect(boundedLevel(encodePaise(200n),encodePaise(100n))).toBe(100);
 expect(boundedLevel(encodePaise(1n),encodePaise(0n))).toBe(0);
 expect(positiveSpendAmount('0.01')).toBe('1');expect(()=>positiveSpendAmount('0')).toThrow();
});
