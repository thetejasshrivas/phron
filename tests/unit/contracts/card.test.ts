import {test,expect} from '@jest/globals';
import {parseCardLifecycle,parseCardPayment,parseCardRecords} from '@/contracts/card';
const id='12345678-1234-4123-8123-123456789abc',other='22345678-1234-4123-8123-123456789abc';
const envelope=(input:unknown)=>({operationId:id,expectedVersion:'1',input});
const purchase={action:'create',amount:'100',bucketId:id,transactionDate:'2026-10-08',merchantOrPayee:'Synthetic',paymentMethod:'card',legacyObligationId:null};
const payment={paymentDate:'2026-10-08',tracked:[{purchaseId:id,amount:'100'}],legacy:[]};
const row={id,cycleId:id,bucketId:id,amount:'100',transactionDate:'2026-10-08',merchantOrPayee:'Synthetic',paymentMethod:'card',paid:'0'};
const records={revision:'1',cycleId:id,openedOn:'2026-10-08',transactions:[row],payments:[{id,cycleId:id,...payment}],legacy:[{id,name:'Synthetic legacy',unpaid:'100'}]};
test('card lifecycle discriminated transport covers every approved operation exactly',()=>{
 for(const input of [purchase,{...purchase,action:'update',transactionId:id},{action:'delete',transactionId:id},{action:'restore',transactionId:id,deleteOperationId:id},{action:'payment_reverse',paymentId:id},{action:'payment_correct',paymentId:id,payment}])expect(parseCardLifecycle(envelope(input)).input).toEqual(input);
 expect(parseCardLifecycle(envelope({...purchase,amount:'9007199254740993'})).input).toHaveProperty('amount','9007199254740993');
 expect(parseCardLifecycle(envelope({...purchase,legacyObligationId:id})).input).toHaveProperty('legacyObligationId',id);
});
test.each([null,undefined,[],1,'x',{}, {action:'unknown'}, {...purchase,user_id:id}, {...purchase,amount:'0'}, {...purchase,paymentMethod:'upi'}, {...purchase,legacyObligationId:1}, {...purchase,bucketId:'bad'}, {...purchase,bucketId:1}, {...purchase,transactionDate:'2026-02-30'}, {...purchase,merchantOrPayee:' '}, {...purchase,merchantOrPayee:1}, {...purchase,merchantOrPayee:'x'.repeat(101)}, {...purchase,amount:9007199254740992}, {...purchase,amount:'-1'}, {...purchase,amount:'1.1'}, {...purchase,amount:'9223372036854775808'}, {action:'delete'}, {action:'restore',transactionId:id,deleteOperationId:'bad'}])('invalid purchase/lifecycle input rejects %p',input=>expect(()=>parseCardLifecycle(envelope(input))).toThrow());
test('payment allocations canonicalize UUIDs/order, keep paise exact and preserve both allocation classes',()=>{
 const input={...payment,tracked:[{purchaseId:other.toUpperCase(),amount:'1'},{purchaseId:id.toUpperCase(),amount:'9007199254740993'}],legacy:[{cycleObligationId:id.toUpperCase(),amount:'1'}]};
 expect(parseCardPayment(envelope(input)).input).toEqual({...payment,tracked:[{purchaseId:id,amount:'9007199254740993'},{purchaseId:other,amount:'1'}],legacy:[{cycleObligationId:id,amount:'1'}]});
});
test.each([null,[],1,{}, {...payment,tracked:null},{...payment,tracked:[]},{...payment,tracked:Array(101).fill(payment.tracked[0])},{...payment,legacy:Array(101).fill({cycleObligationId:id,amount:'1'})}, {...payment,tracked:[null]}, {...payment,tracked:[{purchaseId:1,amount:'1'}]}, {...payment,tracked:[{purchaseId:'bad',amount:'1'}]}, {...payment,tracked:[payment.tracked[0],payment.tracked[0]]}, {...payment,tracked:[{purchaseId:id,amount:'0'}]}, {...payment,tracked:[{purchaseId:id,amount:'-1'}]}, {...payment,tracked:[{purchaseId:id,amount:1}]}, {...payment,tracked:[{purchaseId:id,amount:'1',extra:true}]}])('invalid allocation transport rejects %p',input=>expect(()=>parseCardPayment(envelope(input))).toThrow());
test('record transport retains canonical fields without unknown private data',()=>{
 expect(parseCardRecords(records)).toEqual(records);
 expect(parseCardRecords({...records,transactions:[],payments:[],legacy:[]})).toEqual({...records,transactions:[],payments:[],legacy:[]});
 expect(parseCardRecords({...records,transactions:[{...row,paymentMethod:'cash'}]}).transactions[0]?.paymentMethod).toBe('cash');
});
test.each([null,{}, {...records,transactions:null},{...records,payments:null},{...records,legacy:null},{...records,user_id:id},{...records,revision:'-1'}, {...records,transactions:[{...row,amount:'0'}]},{...records,transactions:[{...row,paid:'101'}]},{...records,transactions:[{...row,paid:'-1'}]},{...records,transactions:[{...row,paymentMethod:'bad'}]},{...records,legacy:[{id,name:'Synthetic',unpaid:'-1'}]},{...records,transactions:[{...row,amount:100}]}])('invalid record response fails closed %p',value=>expect(()=>parseCardRecords(value)).toThrow());
