import {parseSpendInput} from './parse';
import type {ManualSpendInput} from './types';

/** Provider-free FIT13 boundary. This module has no database/client capability.
 * Model output is a draft, never an operation envelope or authorization.
 * PH19 must route confirmed input through the existing authenticated mutation
 * handler; ownership, cycle, revision and ledger effects are revalidated there.
 * This does not select a provider schema, confidence policy or payment method.
 */
export function ingestAiSpendOutput(output:unknown, ownedBucketIds:readonly string[]):Readonly<{kind:'draft';input:Readonly<ManualSpendInput>}> {
 try {
  if(typeof output!=='string' || Buffer.byteLength(output,'utf8')>65536) throw new TypeError('VALIDATION');
  const input=parseSpendInput(JSON.parse(output));
  if(!ownedBucketIds.includes(input.bucketId)) throw new TypeError('VALIDATION');
  return Object.freeze({kind:'draft',input:Object.freeze(input)});
 } catch {throw new TypeError('VALIDATION');}
}
