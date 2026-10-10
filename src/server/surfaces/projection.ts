import type { SurfaceData, SurfaceSource } from '@/contracts/surfaces';
import { decodePaise, encodePaise, type Paise } from '@/contracts/money';
import { cycleDayIndex } from '@/domain/dates';
import { goalPace } from '@/domain/recovery';
import { firefightMargin } from '@/domain/firefight';
import { generateCoachResponse } from '@/server/finance/coach';
import { formatMoney } from '@/client/home-presentation';

const days=(start:string,end:string)=>Math.round((Date.parse(`${end}T00:00:00Z`)-Date.parse(`${start}T00:00:00Z`))/86400000);
/** Server-only aggregation of exact canonical inputs. Never authorizes a mutation. */
export function projectSurfaces(source: SurfaceSource): SurfaceData {
  const {snapshot}=source;
  const goals=source.goals.map(goal=>{
    const pace=goalPace(decodePaise(goal.target),decodePaise(goal.accumulated),Math.max(1,days(goal.startedOn,goal.targetDate)),days(goal.startedOn,snapshot.asOfDate));
    return {...goal,pace:pace.status,deficit:encodePaise(pace.deficit),cashExecutable:!(snapshot.health==='C'&&goal.kind==='WANT')&&goal.status==='COMPLETED'&&decodePaise(goal.held)>0n&&decodePaise(snapshot.money.cash)>=decodePaise(goal.held)};
  });
  const categories=source.buckets.map(bucket=>{
    const weeks:[bigint,bigint,bigint,bigint]=[0n,0n,0n,0n];
    for(const transaction of source.history.filter(row=>row.bucketId===bucket.id&&row.cycleId===snapshot.cycleId)){
      const index=cycleDayIndex(source.cycle.openedOn,transaction.date);
      const block=Math.min(3,Math.floor((index-1)/7)) as 0|1|2|3;
      weeks[block]+=decodePaise(transaction.amount);
    }
    return {id:bucket.id,name:bucket.name,allocation:bucket.allocation,total:encodePaise(weeks.reduce((a,b)=>a+b,0n)),weeks:weeks.map(encodePaise) as [Paise,Paise,Paise,Paise]};
  });
  for(const obligation of source.obligations){
    const weeks:[bigint,bigint,bigint,bigint]=[0n,0n,0n,0n];
    for(const payment of obligation.payments){const index=cycleDayIndex(source.cycle.openedOn,payment.date);weeks[Math.min(3,Math.floor((index-1)/7)) as 0|1|2|3]+=decodePaise(payment.amount);}
    categories.push({id:obligation.id,name:`${obligation.name} · obligation`,allocation:obligation.allocation,total:encodePaise(weeks.reduce((a,b)=>a+b,0n)),weeks:weeks.map(encodePaise) as [Paise,Paise,Paise,Paise]});
  }
  const elapsed=cycleDayIndex(source.cycle.openedOn,snapshot.asOfDate);
  let cumulative=0n;
  const burn=Array.from({length:elapsed},(_,i)=>{
    const day=i+1;
    for(const row of source.history)if(row.cycleId===snapshot.cycleId&&cycleDayIndex(source.cycle.openedOn,row.date)===day)cumulative+=decodePaise(row.amount);
    return {day,actual:encodePaise(cumulative),pace:encodePaise(decodePaise(snapshot.money.safePool)*BigInt(day)/BigInt(elapsed))};
  });
  const deficit=source.buckets.reduce((sum,b)=>sum+(decodePaise(b.spent)>decodePaise(b.allocation)?decodePaise(b.spent)-decodePaise(b.allocation):0n),0n);
  let coach=generateCoachResponse({overspendDeficitPaise:encodePaise(deficit),weeklyCategoryTrims:[],goalPaceStatus:goals.some(g=>g.pace==='BEHIND')?'BEHIND':goals.some(g=>g.pace==='ON_TRACK')?'ON_TRACK':goals.some(g=>g.pace==='COMPLETED')?'COMPLETE':'NONE'});
  if(snapshot.health==='C'){
    const margin=firefightMargin({health:'C',cash:decodePaise(snapshot.money.cash),unpaidObligations:decodePaise(snapshot.money.unpaidObligations),essentialBuckets:source.buckets.filter(b=>['Groceries','Transit'].includes(b.canonicalName)).map(b=>({allocation:decodePaise(b.allocation),spent:decodePaise(b.spent)}))});
    coach=`One thing at a time. Firefight Margin: ${formatMoney(encodePaise(margin.essentialAllowance))} in essential allowances; ${formatMoney(encodePaise(margin.cashAboveUnpaid))} cash above unpaid obligations. These are accounting labels, not extra cash or spending permission. Review what is due first.`;
  }
  else if(source.recoveryTrims.length)coach=`Setbacks happen. Your accepted recovery plan reduced active allowances: ${source.recoveryTrims.map(t=>`${t.category} ${formatMoney(t.amount)}`).join('; ')}. Those trims are already applied, not new spending or an extra payment. ${snapshot.health==='B'?'Discretionary permission remains paused.':'Your overall permission remains positive.'}`;
  return {...source,goals,coach,chart:{categories,total:encodePaise(categories.reduce((sum,c)=>sum+decodePaise(c.total),0n)),burn,paceLabel:'Current safe pool reference: a linear view of today’s confirmed pool across the displayed cycle days. Neither historical permission nor a new spending limit.'}};
}
