import {expect,test} from '@jest/globals';
import {previewReconciliation} from '@/server/surfaces/reconciliation-preview';
test('server preview uses exact D06/D22 math and inclusive Rs500 prompts without mutation',()=>{
 expect(previewReconciliation('2200000','1950000')).toEqual({reportedCash:'1950000',signedDrift:'-250000',prompt:'recall'});
 expect(previewReconciliation('1800000','2000000')).toEqual({reportedCash:'2000000',signedDrift:'200000',prompt:'positive'});
 expect(previewReconciliation('100000','50000').prompt).toBe('recall');
 expect(previewReconciliation('100000','50001').prompt).toBe('absorb');
 expect(previewReconciliation('100000','150000').prompt).toBe('positive');
 expect(previewReconciliation('100000','149999').prompt).toBe('absorb');
 expect(()=>previewReconciliation('100000','-1')).toThrow();
});
