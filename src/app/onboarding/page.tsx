import { redirect } from 'next/navigation';
import { requirePageUser } from '@/lib/supabase/server';
import { Onboarding } from '@/components/auth/Onboarding';
import '@/styles/auth.css';
export const dynamic='force-dynamic';
export default async function OnboardingPage() {
  const client=await requirePageUser();
  const profile=await client.from('financial_profiles').select('id').maybeSingle();
  if(profile.error) return <main className="auth-shell"><h1>We couldn’t load your starting point.</h1><p>Try again shortly. Nothing has been saved.</p><a href="/onboarding">Try again</a></main>;
  if(profile.data) redirect('/home');
  return <Onboarding/>;
}
