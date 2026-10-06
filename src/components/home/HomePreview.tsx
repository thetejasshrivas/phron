"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";
import { buckets, capturedBuckets, capturedGoals, capturedHealthy, formatMoney, goals, homeFixtures, type HomeState } from "@/client/home-fixtures";

export function HomePreview() {
  const [state, setState] = useState<HomeState>("healthy");
  const [captured, setCaptured] = useState(false);
  const [goalFilled, setGoalFilled] = useState(false);
  const [entry, setEntry] = useState("");
  const [notice, setNotice] = useState("");
  const [details, setDetails] = useState(false);
  const ready = state !== "empty" && state !== "loading";
  const fixture = ready ? (state === "healthy" && captured ? capturedHealthy : homeFixtures[state as keyof typeof homeFixtures]) : null;
  const visibleBuckets = captured && state === "healthy" ? capturedBuckets : buckets;
  const visibleGoals = goalFilled ? capturedGoals : goals;
  function changeState(value: HomeState) { setState(value); setCaptured(false); setGoalFilled(false); setNotice(""); setDetails(false); }
  function capture(event: FormEvent) {
    event.preventDefault();
    if (entry.trim().toLowerCase() === "420 lunch" && state === "healthy") {
      setCaptured(true); setEntry(""); setNotice("Sample lunch shown. Nothing saved.");
    } else { setNotice("Capture preview only. Nothing saved. Use the sample to see the bucket transition."); }
  }
  return <div className="phron-home">
    <a className="skip-home" href="#home-main">Skip to your day</a>
    <aside className="home-sidebar" aria-label="PHRON identity">
      <Link className="home-brand" href="/">phron<span aria-hidden="true">↗</span></Link>
      <p className="brand-note">Money, in perspective.</p>
      <nav aria-label="Home navigation"><a href="#home-main" aria-current="page">Your day <span aria-hidden="true">↗</span></a><a href="#bucket-section">Your buckets</a><a href="#goal-section">Your goals</a></nav>
      <div className="sidebar-bottom"><span className="profile-mark" aria-hidden="true">S</span><div>Sample household<small>Design preview</small></div></div>
    </aside>
    <main id="home-main" className="home-main">
      <div className="preview-bar"><span>Synthetic preview · Nothing is saved</span><label>View <select value={state} onChange={(event) => changeState(event.target.value as HomeState)} aria-label="Preview state"><option value="healthy">Healthy</option><option value="exhausted">Budget exhausted</option><option value="distressed">Distressed</option><option value="empty">Empty</option><option value="loading">Loading</option></select></label></div>
      <header className="day-header"><div><p>YOUR DAILY PERSPECTIVE</p><h1>{fixture?.title ?? (state === "empty" ? "Start with where you are." : "Finding your perspective.")}</h1></div><span className="cycle-label">Sample cycle<small>14 spending days left</small></span></header>
      <div className="perspective-grid">
        <section className={`sts-panel ${state}`} aria-labelledby="sts-title" aria-busy={state === "loading"}>
          <div className="sts-top"><h2 id="sts-title">Safe to spend today</h2><span className="state-label">{fixture?.label ?? (state === "loading" ? "Loading" : "Not set up yet")}</span></div>
          {state === "loading" ? <div className="loading-amount" aria-label="Loading safe to spend" /> : <p className="sts-number">{fixture ? formatMoney(fixture.daily) : "Not set"}<span>{fixture ? "/ day" : ""}</span></p>}
          <p className="sts-context">{state === "distressed" ? "Discretionary spending paused. Essential coverage comes first." : state === "exhausted" ? "No discretionary room remains. This is separate from essential coverage." : state === "empty" ? "Confirm your starting position to get a daily perspective." : state === "loading" ? "Your last numbers stay unconfirmed while loading." : "A little freedom, with your essentials already protected."}</p>
          <div className="pool-line"><span>{fixture ? `${formatMoney(fixture.pool)} left this cycle` : "Cycle perspective pending"}</span><span>{fixture ? `${fixture.days} days` : ""}</span></div>
          <div className="cycle-track" aria-hidden="true"><span style={{ transform: `scaleX(${fixture && state === "healthy" ? .62 : 0})` }} /></div>
          <span className="pool-note">{ready ? "Sample canonical outputs · INR" : "No financial values inferred"}</span>
        </section>
        <section className="coach-panel" aria-labelledby="coach-title"><div className="coach-sign" aria-hidden="true">p<span>↗</span></div><p className="coach-label">A LITTLE PERSPECTIVE</p><h2 id="coach-title">{state === "distressed" ? "One thing at a time." : state === "exhausted" ? "You can find your footing." : "You’re making room."}</h2><p>{fixture?.coach ?? (state === "empty" ? "Start with your current cash and what is still due. A clear starting point beats a perfect one." : "Take a breath. Your perspective will be here when the numbers are ready.")}</p><button type="button" className="text-action" disabled={!ready} onClick={() => setDetails(!details)} aria-expanded={details}>{fixture?.action ?? "Waiting for your perspective"}<span aria-hidden="true">↗</span></button>{details && <div className="coach-details">This is a sample view. No recovery plan is calculated or accepted here. Your real options will use verified numbers.</div>}</section>
      </div>
      <section className="capture-panel" aria-labelledby="capture-title"><div><h2 id="capture-title">Spent something?</h2><p>A few words is a good place to start.</p></div><form onSubmit={capture}><label className="sr-only" htmlFor="spend-entry">Describe a sample expense</label><input id="spend-entry" placeholder="e.g. 420 lunch" value={entry} onChange={(event) => setEntry(event.target.value)} maxLength={140} disabled={!ready} /><button className="capture-button" disabled={!entry.trim() || !ready}>Preview capture <span aria-hidden="true">↗</span></button></form><button className="sample-action" disabled={!ready} onClick={() => { setEntry("420 lunch"); document.getElementById("spend-entry")?.focus(); }}>Use sample entry</button></section>
      <p className="capture-notice" role="status">{notice || "Sample controls only. No bank connection, AI call or financial write."}</p>
      <section className="buckets-section" id="bucket-section" aria-labelledby="buckets-title"><div className="section-heading"><div><h2 id="buckets-title">Give your money some shape.</h2><p>Your buckets drain as you spend. What remains is what you can see.</p></div><span className="section-count">05 buckets</span></div>
        {state === "empty" ? <div className="empty-line">Your buckets will live here. Start with your essentials and choose the limits that fit your life.</div> : state === "loading" ? <div className="loading-buckets" aria-label="Loading five buckets">{buckets.map((bucket) => <div key={bucket.name} />)}</div> : <div className="bucket-grid">{visibleBuckets.map((bucket) => <article className={`bucket ${bucket.tone}`} key={bucket.name}><div className="bucket-vessel" role="img" aria-label={`${bucket.name}: ${formatMoney(bucket.remaining)} sample allowance remaining of ${formatMoney(bucket.allowance)}. ${state === "healthy" ? "Spending follows the global safe-to-spend limit." : "Discretionary permission is zero."}`}><div className="vessel-ticks" aria-hidden="true" /><div className="bucket-liquid" style={{ "--level": `${bucket.level}%` } as CSSProperties} aria-hidden="true" /><span className="vessel-label" aria-hidden="true">{bucket.name.slice(0, 2).toUpperCase()}</span></div><h3>{bucket.name}</h3><p>{formatMoney(bucket.remaining)}</p><small>remaining</small><small>of {formatMoney(bucket.allowance)}</small>{state !== "healthy" && <span className="paused-label">Spending paused</span>}</article>)}</div>}
      </section>
      <section className="goals-section" id="goal-section" aria-labelledby="goals-title"><div className="section-heading"><div><h2 id="goals-title">A future worth making room for.</h2><p>Small fills. Something to look forward to.</p></div>{ready && <button className="text-action" disabled={state === "distressed"} onClick={() => { setGoalFilled(true); setNotice("Sample goal fill shown. Nothing reserved or moved."); }}>Preview a goal fill <span aria-hidden="true">↗</span></button>}</div>{!ready ? <div className="empty-line">{state === "empty" ? "Choose a goal when you are ready. Nothing is reserved automatically." : "Loading your goal perspective…"}</div> : <div className="goal-grid">{visibleGoals.map((goal) => <article className="goal" key={goal.name}><div className="goal-stamp" aria-hidden="true">{goal.mark}<span>↗</span></div><div className="goal-content"><h3>{goal.name}</h3><p>{goal.description} · {goal.deadline}</p><span className="goal-pace">{state === "distressed" ? "Permission paused" : goal.pace}</span><div className="goal-amount"><strong>{formatMoney(goal.held)}</strong><span>of {formatMoney(goal.target)}</span></div><div className="goal-track" role="img" aria-label={`${goal.name}: ${formatMoney(goal.held)} saved toward ${formatMoney(goal.target)}. Sample data.`}><span style={{ width: `${goal.level}%` }} /></div><small>{state === "distressed" ? "Held amount shown. No purchase available." : "Sample saved amount · No purchase action"}</small></div></article>)}</div>}</section>
      <footer className="home-footer"><span>Clarity over perfection.</span><span>All figures are synthetic. Your money stays yours.</span></footer>
    </main>
  </div>;
}
