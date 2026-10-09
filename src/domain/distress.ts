import type {Health} from "./core";
import {nonnegativePaise} from "./money";

/** D14: the caller supplies a verified health state and confirmed rollover event. */
export function bucketPolicy(health:Health, category:string, bucket:Readonly<{active:bigint;baseline:bigint;floor:bigint}>, confirmedRollover:boolean) {
 if(!["A","B","C"].includes(health)||typeof confirmedRollover!=="boolean")throw new TypeError("Invalid distress policy context");
 const active=nonnegativePaise(bucket.active),baseline=nonnegativePaise(bucket.baseline),floor=nonnegativePaise(bucket.floor);
 const wantGoalsLocked=health==="C";
 const allocation=wantGoalsLocked && (category==="dining"||category==="entertainment") ? 0n : confirmedRollover ? baseline : active;
 return {allocation,floor,wantGoalsLocked};
}
