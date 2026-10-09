import {test,expect} from '@jest/globals';
import fc from 'fast-check';
import {calculateCash,calculateMargins} from '@/domain/core';
import {salaryOpening} from '@/domain/cycle';
import {purchaseChange,paymentChange,applyCardEffects,cardReserve,type Purchase,type Payment} from '@/domain/card';
import {goalSchedule,planRecovery} from '@/domain/recovery';

test('FIT01/02/03 arbitrary valid mixed sequences preserve independent ledger and reserve models',()=>{
 fc.assert(fc.property(fc.array(fc.record({kind:fc.constantFrom('buy','pay','goal','trim','rollover'),amount:fc.bigInt({min:1n,max:10000000n})}),{minLength:1,maxLength:100}),commands=>{
  let cash=10000n,spent=0n,reserve=0n,budget=6000000n,held=0n,inflows=0n,outflows=0n,cycle=0,goalIndex=1;
  let ledger={cash,spent,cardReserve:reserve,unpaidObligations:0n};
  const purchases:Purchase[]=[],payments:Payment[]=[],remaining=new Map<string,bigint>();
  commands.forEach(({kind,amount},index)=>{
   const context={owner:'synthetic',cycle:String(cycle)};
   if(kind==='buy'){
    const p:Purchase={id:String(index),owner:context.owner,cycle:context.cycle,bucket:'dining',amount,method:'card',legacy:false};
    ledger=applyCardEffects(ledger,purchaseChange(context,null,p,0n));purchases.push(p);remaining.set(p.id,amount);spent+=amount;reserve+=amount;
   }
   if(kind==='pay'){
    const p=purchases.find(p=>(remaining.get(p.id)??0n)>0n);
    if(p){const paid=amount<remaining.get(p.id)!?amount:remaining.get(p.id)!;
     const payment:Payment={id:`pay${index}`,owner:context.owner,cycle:context.cycle,allocations:[{purchaseId:p.id,amount:paid}],legacyAmount:0n};
     ledger=applyCardEffects(ledger,paymentChange(context,purchases,payments,null,payment));payments.push(payment);remaining.set(p.id,remaining.get(p.id)!-paid);cash-=paid;outflows+=paid;reserve-=paid;
    }
   }
   if(kind==='goal'&&goalIndex<=3){const expected=goalIndex===3?34n:33n;expect(goalSchedule(100n,0n,3,goalIndex++)).toBe(expected);held+=expected;budget-=expected;}
   if(kind==='trim'){
    const before={cash,spent,reserve,budget,held};
    const r=planRecovery(amount,[{category:'entertainment',balance:200n,floor:50n},{category:'groceries',balance:1000n,floor:0n}]);
    const cut=amount<150n?amount:150n;expect(r).toEqual({cuts:[{category:'entertainment',amount:cut}],uncovered:amount-cut});expect({cash,spent,reserve,budget,held}).toEqual(before);
   }
   if(kind==='rollover'){
    const next=salaryOpening(cash,amount,0n,0n,0n);cash+=amount;inflows+=amount;expect(next.cash).toBe(cash);budget=amount;spent=0n;cycle++;ledger={...ledger,cash,spent:0n};
   }
   expect(ledger).toEqual({cash,spent,cardReserve:reserve,unpaidObligations:0n});
   expect(cardReserve(context.owner,purchases,payments)).toBe(reserve);
   expect(calculateCash({opening:10000n,confirmedInflows:inflows,cashOutflows:outflows,signedDrift:0n})).toBe(cash);
   // Signed budget adjustments are represented separately from positive cycle income.
   const mb=budget-spent,ml=cash-reserve-held,expected=mb<ml?mb:ml;
   const margins=calculateMargins({cycleIncome:budget+held,totalObligations:0n,commitmentDue:0n,goalCycle:held,spent,cash,unpaidObligations:0n,cardReserve:reserve,goalHeld:held});
   expect(margins.safePool).toBe(expected>0n?expected:0n);
   if(ml<=0n)expect(margins.safePool).toBe(0n);
  });
 }),{seed:181802,numRuns:1000});
});
