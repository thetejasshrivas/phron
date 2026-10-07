import '@/styles/auth.css';
export const dynamic='force-dynamic';
export default async function SignIn({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const failed=(await searchParams).error==='callback';
  return <main className="auth-shell"><p className="auth-eyebrow">PHRON / YOUR EVERYDAY MONEY</p>
    <h1>A little clarity.<br/>Room to breathe.</h1>
    <p>Sign in to begin with what you have, what is due, and what you can safely spend.</p>
    {failed && <p role="alert" className="auth-error">That sign-in link could not be used. Start again to get a fresh link.</p>}
    <form action="/api/auth/google" method="post"><button className="auth-primary" type="submit">Continue with Google <span aria-hidden="true">↗</span></button></form>
    <p className="auth-note">This is a development preview. Use a synthetic test account and fictional financial details. AI features are not enabled here.</p>
  </main>;
}
