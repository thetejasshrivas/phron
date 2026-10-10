import type {RecoveryContext,RecoveryProposal,SurfaceSource} from '@/contracts/surfaces';
import {decodePaise as money,encodePaise as exact} from '@/contracts/money';
import {financialDate} from '@/contracts/boundaries';
import {commitmentCapacity,flexibleExtensionDays,hasCashPaymentCapacity,planRecovery,type RecoveryCategory} from '@/domain/recovery';
const canonical:Record<string,RecoveryCategory>={Entertainment:'entertainment',Shopping:'shopping',Dining:'dining',Transit:'transit',Groceries:'groceries'};
/** Deterministic read-only proposals. Acceptance repeats authoritative checks in SQL. */
export function projectRecovery(source:SurfaceSource,context:RecoveryContext):RecoveryProposal[]{
 if(source.snapshot.health==='C')return [];
 const proposals:RecoveryProposal[]=[];
 for(const bucket of source.buckets){
  const covered=context.covered.filter(c=>c.bucketId===bucket.id).reduce((sum,c)=>sum+money(c.amount),0n);
  const deficit=money(bucket.spent)-money(bucket.allocation)-covered;if(deficit<=0n)continue;
  const donors=source.buckets.filter(b=>b.id!==bucket.id&&!b.custom&&Object.hasOwn(canonical,b.canonicalName));
  const plan=planRecovery(deficit,donors.map(b=>({category:canonical[b.canonicalName]!,balance:money(b.allocation)>money(b.spent)?money(b.allocation)-money(b.spent):0n,floor:money(b.activeFloor)})));
  const available=context.commitmentsEnabled?commitmentCapacity(money(source.snapshot.money.sustainableIncome),money(context.obligations),money(context.created),context.carried):0n;
  const amount=source.goals.some(g=>g.dateType==='FIXED'&&!['CANCELLED','COMPLETED'].includes(g.status))?(available<plan.uncovered?available:plan.uncovered):0n;
  const purchases=context.purchases.filter(p=>p.bucketId===bucket.id&&money(p.amount)>=plan.uncovered);
  const capacity=plan.uncovered>0n&&(hasCashPaymentCapacity(money(source.snapshot.money.cash),money(source.snapshot.money.unpaidObligations),money(source.snapshot.money.accruedCardReserve),plan.uncovered)||purchases.length>0);
  const flexible:RecoveryProposal['flexible']=[];
  for(const goal of source.goals.filter(g=>g.dateType==='FLEXIBLE'&&!['CANCELLED','COMPLETED'].includes(g.status))){
   const days=flexibleExtensionDays(plan.uncovered,money(goal.monthly));
   if(days===null||days===0n||days>3652059n)continue;
   const date=new Date(`${goal.targetDate}T00:00:00Z`);date.setUTCDate(date.getUTCDate()+Number(days));
   if(date.getUTCFullYear()>9999)continue;
   flexible.push({goalId:goal.id,days:Number(days),targetDate:financialDate(date.toISOString().slice(0,10))});
  }
  proposals.push({sourceBucketId:bucket.id,name:bucket.name,deficit:exact(deficit),residual:exact(plan.uncovered),trims:plan.cuts.map(c=>{const donor=donors.find(b=>canonical[b.canonicalName]===c.category)!;return {bucketId:donor.id,name:donor.name,amount:exact(c.amount)};}),flexible,commitment:{amount:exact(amount),unresolved:exact(plan.uncovered-amount),paymentCapacity:capacity,purchaseIds:purchases.map(p=>p.id)}});
 }
 return proposals;
}
