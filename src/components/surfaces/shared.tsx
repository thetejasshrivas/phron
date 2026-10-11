'use client';
import { PhronLogo } from '@/components/brand/PhronLogo';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { SurfaceSession } from '@/client/surface-session';
export function useSurfaces(revision?:string){
 const [session]=useState(()=>new SurfaceSession((...args)=>fetch(...args),()=>crypto.randomUUID()));
 const view=useSyncExternalStore(session.subscribe,session.getSnapshot,session.getSnapshot);
 useEffect(()=>{if(revision!==undefined&&session.getSnapshot().data?.snapshot.revision===revision)return;void session.refresh();},[session,revision]);
 useEffect(()=>()=>session.dispose(),[session]);
 return {session,view};
}
export function useOffline(){
 const [offline,setOffline]=useState(false);
 useEffect(()=>{const update=()=>setOffline(!navigator.onLine);update();window.addEventListener('offline',update);window.addEventListener('online',update);return()=>{window.removeEventListener('offline',update);window.removeEventListener('online',update);};},[]);
 return offline;
}
export function SurfaceShell({active,title,description,children}:{active:'visualize'|'manage';title:string;description:string;children:ReactNode}){
 return <div className="phron-home surface-shell"><a className="skip-home" href="#surface-main">Skip to content</a><aside className="home-sidebar"><a className="home-brand" href="/home"><PhronLogo /><span aria-hidden="true">↗</span></a><p className="brand-note">Money, in perspective.</p><nav aria-label="Primary navigation"><a href="/home">Your day</a><a href="/visualize" aria-current={active==='visualize'?'page':undefined}>Visualize spending</a><a href="/manage" aria-current={active==='manage'?'page':undefined}>Buckets &amp; settings</a></nav><div className="sidebar-bottom"><form action="/api/auth/logout" method="post"><button className="text-action">Sign out</button></form></div></aside><main id="surface-main" tabIndex={-1} className="home-main"><header className="surface-header"><h1>{title}</h1><p>{description}</p></header>{children}<footer className="home-footer">Clarity over perfection.</footer></main></div>;
}
export function SurfaceFeedback({view,session}:{view:ReturnType<SurfaceSession['getSnapshot']>;session:SurfaceSession}){
 const offline=useOffline();
 return <div className="surface-feedback" aria-busy={view.phase==='pending'}>{offline&&<p role="alert">No internet connection. Transactions cannot be saved while offline. Your inputs stay here.</p>}<p role={view.phase==='error'||view.phase==='retry'?'alert':'status'}>{view.notice}</p>{view.phase==='retry'&&<><button disabled={offline} className="text-action" onClick={()=>void session.retry()}>Retry same save ↗</button><button disabled={offline} className="text-action" onClick={()=>void session.review()}>Refresh to review what saved ↗</button></>}{(view.phase==='error'||view.phase==='ready')&&<button className="text-action" onClick={()=>void session.refresh()}>Refresh confirmed records ↗</button>}{view.phase==='auth'&&<a href="/sign-in">Sign in again ↗</a>}</div>;
}
