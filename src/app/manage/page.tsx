import { Manage } from '@/components/surfaces/Manage';
import { requirePageUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import '@/styles/home.css';
import '@/styles/surfaces.css';
export const dynamic='force-dynamic';
export const metadata={title:'PHRON · Buckets & settings'};
export default async function Page(){const client=await requirePageUser();const result=await client.from('financial_profiles').select('id').maybeSingle();if(result.error)return <main><h1>Unable to load your profile.</h1><p>Try again shortly.</p></main>;if(!result.data)redirect('/onboarding');return <Manage/>;}
