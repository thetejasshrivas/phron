import type { SurfaceAction, SurfaceData, SurfaceIntent } from '@/contracts/surfaces';
import { parseSurfaceSource } from '@/server/surfaces/parse';
import { parseSnapshot } from '@/contracts/snapshot';
export type SurfaceView={data:SurfaceData|null;phase:'loading'|'ready'|'pending'|'retry'|'error'|'auth';notice:string};
/** One stable intent survives transport failures. No optimistic ledger values. */
export class SurfaceSession {
 private view:SurfaceView={data:null,phase:'loading',notice:'Loading confirmed records…'};
 private listeners=new Set<()=>void>();private intent:SurfaceIntent|null=null;private generation=0;
 constructor(private fetcher:typeof fetch,private uuid:()=>string){}
 getSnapshot=()=>this.view;
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>this.listeners.delete(listener);};
 private set(view:SurfaceView){this.view=view;this.listeners.forEach(fn=>fn());}
 async refresh(){
  if(this.intent)return;
  const generation=++this.generation;
  this.set({...this.view,phase:'loading',notice:'Loading confirmed records…'});
  try{
   const response=await this.fetcher('/api/finance/surfaces',{credentials:'same-origin',cache:'no-store'});
   if(generation!==this.generation)return;
   if(response.status===401){this.set({data:null,phase:'auth',notice:'Sign in again to continue.'});return;}
   const result=await response.json();if(!response.ok||result.ok!==true)throw new Error('UNCONFIRMED');
   parseSurfaceSource(Object.fromEntries(Object.entries(result.data as SurfaceData).filter(([key])=>!['coach','chart'].includes(key)).map(([key,value])=>[key,key==='goals'?(value as SurfaceData['goals']).map(({pace: _pace,deficit: _deficit,cashExecutable: _cashExecutable,...goal})=>{void _pace;void _deficit;void _cashExecutable;return goal;}):value])));
   if(typeof result.data.coach!=='string'||!Array.isArray(result.data.chart?.categories)||!Array.isArray(result.data.chart?.burn))throw new Error('UNCONFIRMED');
   this.set({data:result.data as SurfaceData,phase:'ready',notice:'Confirmed records loaded.'});
  }catch{if(generation===this.generation)this.set({...this.view,phase:'error',notice:'Unable to load. Your last confirmed records stay here; refresh to retry.'});}
 }
 async save(input:SurfaceAction){
  if(this.intent||!this.view.data||this.view.phase==='loading')return false;
  this.intent={operationId:this.uuid(),expectedVersion:this.view.data.snapshot.revision,input:structuredClone(input)};
  return this.send();
 }
 retry=()=>this.intent?this.send():Promise.resolve(false);
 review=async()=>{if(this.view.phase==='pending')return;this.intent=null;await this.refresh();};
 private async send(){
  if(this.view.phase==='pending'||!this.intent)return false;
  this.set({...this.view,phase:'pending',notice:'Saving… confirmed numbers stay in place.'});
  try{
   const response=await this.fetcher('/api/finance/surfaces',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'},body:JSON.stringify(this.intent)});
   const result=await response.json();
   if(!response.ok||result.ok!==true){
    if(response.status===409||response.status===400||response.status===403||response.status===404){this.intent=null;this.set({...this.view,phase:'error',notice:response.status===409?'Your records changed. Refresh and review before trying again.':'Not saved. Review the values and try again.'});return false;}
    if(response.status===401){this.set({data:null,phase:'auth',notice:'Sign in again. No save has been confirmed.'});return false;}
    throw new Error('UNCONFIRMED');
   }
   parseSnapshot(result.data.snapshot);this.intent=null;await this.refresh();
   if(this.view.phase==='ready')this.set({...this.view,notice:'Saved. Your confirmed records are updated.'});return true;
  }catch{this.set({...this.view,phase:'retry',notice:'Save not confirmed. Retry the same operation; it cannot write twice.'});return false;}
 }
 dispose(){this.generation++;this.listeners.clear();}
}
