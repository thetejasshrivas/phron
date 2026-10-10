import { Home } from "@/components/home/Home";
import { requirePageUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import "@/styles/home.css";
import "@/styles/surfaces.css";

export const metadata = { title: "PHRON · Your day" };
export const dynamic = 'force-dynamic';
export default async function HomePage() {
  const client=await requirePageUser();
  const profile=await client.from('financial_profiles').select('id').maybeSingle();
  if(profile.error) return <main><h1>Unable to load your profile.</h1><p>Try again shortly.</p></main>;
  if(!profile.data) redirect('/onboarding');
  return <Home />;
}
