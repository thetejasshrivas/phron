import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,test} from '@jest/globals';
import {HomeDetails} from '@/components/surfaces/HomeDetails';
import {SurfaceSession} from '@/client/surface-session';
import type {SurfaceData} from '@/contracts/surfaces';
test('completed funded goal presents a ready milestone and explicit cash action; distress locks wants',()=>{
 const data={snapshot:{health:'A'},goalsUnlocked:true,goals:[{id:'g',name:'Phone',pace:'COMPLETED',accumulated:'3000000',target:'3000000',held:'3000000',monthly:'0',targetDate:'2027-01-01',dateType:'FIXED',kind:'WANT',cashExecutable:true}]} as unknown as SurfaceData;
 const render=()=>renderToStaticMarkup(createElement(HomeDetails,{section:'goals',data,session:new SurfaceSession(fetch,()=>crypto.randomUUID()),view:{data,phase:'ready',notice:'Confirmed'},onConfirmed:async()=>{}}));
 expect(render()).toContain('Milestone Reached! Ready to purchase.');expect(render()).toContain('Confirm cash purchase using');data.snapshot={...data.snapshot,health:'C'};data.goals[0]!.cashExecutable=false;expect(render()).toContain('Want-goal locked in distress');expect(render()).not.toContain('Confirm cash purchase using');
});
