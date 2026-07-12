"use client";

import { useMemo, useState } from "react";
import { BirthProfile, Placement, calculatePlacements } from "./chart";

type Tier = "free" | "seeker" | "depth" | "practitioner" | "practice" | "research";
type Mode = "beginner" | "expert";
type Section = "home" | "birth" | "chart" | "timing" | "journal" | "practice" | "reports" | "plans" | "account";

const tiers: Array<[Tier, string, string, string[]]> = [
  ["free", "$0", "one chart with simple explanations", ["one birth profile", "basic placements", "glossary"]],
  ["seeker", "$9/mo", "personal chart work", ["multiple charts", "journal links", "timing notes"]],
  ["depth", "$19/mo", "deeper interpretation", ["returns", "synastry notes", "advanced timing"]],
  ["practitioner", "$39/mo", "client-ready workflow", ["client records", "private notes", "exportable reports"]],
  ["practice", "$89/mo", "team workspace", ["shared clients", "consent records", "practice overview"]],
  ["research", "$149/mo", "bulk research tools", ["bulk calculations", "csv exports", "datasets"]]
];

const nav: Array<[Section, string]> = [
  ["home", "today"],
  ["birth", "birth"],
  ["chart", "chart"],
  ["timing", "timing"],
  ["journal", "journal"],
  ["practice", "clients"],
  ["reports", "reports"],
  ["plans", "plans"],
  ["account", "account"]
];

const glossary = [
  ["element balance", "fire, earth, air, and water show the chart's dominant style of expression."],
  ["modality balance", "cardinal, fixed, and mutable show how the chart starts, holds, and adapts."],
  ["retrograde", "a planet read as revisiting, internalizing, or reviewing its themes."],
  ["time certainty", "how much the birth time can be trusted before reading time-sensitive details."]
];

const defaultProfile: BirthProfile = {
  name: "primary chart",
  birthDate: "1994-06-17",
  birthTime: "09:30",
  birthTimeCertainty: "official_recorded",
  locationLabel: "lagos, nigeria"
};

const lower = (value: string) => value.toLowerCase();

const summarize = (placements: Placement[], field: "element" | "modality") => {
  const counts = placements.reduce<Record<string, number>>((all, placement) => {
    const key = lower(placement[field]);
    all[key] = (all[key] ?? 0) + 1;
    return all;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
};

export default function DreamLogicWorkspace() {
  const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL ?? "https://dreamlogic-landingpage.vercel.app";
  const [profile, setProfile] = useState<BirthProfile>(defaultProfile);
  const [section, setSection] = useState<Section>("home");
  const [mode, setMode] = useState<Mode>("beginner");
  const [tier, setTier] = useState<Tier>("free");
  const [journal, setJournal] = useState("moon notes: check emotional pacing before report language.");
  const [clientName, setClientName] = useState("consultation client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("sign in or create an account to keep charts, notes, clients, and reports.");
  const [loading, setLoading] = useState("");

  const placements = useMemo(() => calculatePlacements(profile), [profile]);
  const elementBalance = useMemo(() => summarize(placements, "element"), [placements]);
  const modalityBalance = useMemo(() => summarize(placements, "modality"), [placements]);
  const leadPlacement = placements[1] ?? placements[0];
  const activeNav = nav.find(([key]) => key === section)?.[1] ?? "today";

  const auth = async (intent: "signup" | "login") => {
    setLoading(intent);
    setNotice("checking account...");
    try {
      const response = await fetch("/api/auth/access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intent, email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "account request failed");
      setNotice(data.message);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "account request failed");
    } finally {
      setLoading("");
    }
  };

  const checkout = async (plan: Tier) => {
    setLoading(plan);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "checkout unavailable");
      window.location.href = data.url;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "checkout unavailable");
      setSection("account");
    } finally {
      setLoading("");
    }
  };

  return (
    <main className="app">
      <aside className="rail">
        <a className="logo" href={landingUrl}>
          <img src="/brand/logomain.svg" alt="dream logic" />
        </a>
        <nav aria-label="workspace">
          {nav.map(([key, label]) => (
            <button className={section === key ? "on" : ""} key={key} onClick={() => setSection(key)}>{label}</button>
          ))}
        </nav>
      </aside>

      <section className="work">
        <header className="worktop">
          <div>
            <p>dream logic</p>
            <h1>{activeNav}</h1>
          </div>
          <div className="tools">
            <button className={mode === "beginner" ? "on" : ""} onClick={() => setMode("beginner")}>beginner</button>
            <button className={mode === "expert" ? "on" : ""} onClick={() => setMode("expert")}>expert</button>
            <a href={landingUrl}>landing</a>
            <button onClick={() => setSection("account")}>sign in</button>
          </div>
        </header>

        {section === "home" && (
          <div className="pane-grid">
            <article className="active-chart">
              <img src="/brand/fulllitelogo.svg" alt="dream logic astrology suite" />
              <div>
                <p>active chart</p>
                <h2>{profile.name}</h2>
                <span>{profile.birthDate} / {profile.birthTime} / {profile.locationLabel}</span>
              </div>
              <div className="button-row">
                <button onClick={() => setSection("birth")}>edit birth data</button>
                <button onClick={() => setSection("chart")}>open chart</button>
                <button onClick={() => setSection("reports")}>prepare report</button>
              </div>
            </article>
            <article>
              <p>next read</p>
              <h2>{lower(leadPlacement.body)} in {lower(leadPlacement.sign)}</h2>
              <span>{mode === "beginner" ? "read one placement, then compare it with element and modality balance." : "use the lead placement as the report angle and confirm with balance and timing."}</span>
            </article>
            <Balance title="element balance" items={elementBalance} />
            <Balance title="modality balance" items={modalityBalance} />
          </div>
        )}

        {section === "birth" && (
          <article className="form-pane">
            <p>birth profile</p>
            <div className="fields">
              <label>name<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: lower(event.target.value) })} /></label>
              <label>date<input type="date" value={profile.birthDate} onChange={(event) => setProfile({ ...profile, birthDate: event.target.value })} /></label>
              <label>time<input type="time" value={profile.birthTime} onChange={(event) => setProfile({ ...profile, birthTime: event.target.value })} /></label>
              <label>certainty<select value={profile.birthTimeCertainty} onChange={(event) => setProfile({ ...profile, birthTimeCertainty: event.target.value as BirthProfile["birthTimeCertainty"] })}>
                <option value="official_recorded">official recorded</option>
                <option value="family_reported">family reported</option>
                <option value="approximate">approximate</option>
                <option value="rectified">rectified</option>
                <option value="unknown">unknown</option>
              </select></label>
              <label className="wide">place<input value={profile.locationLabel} onChange={(event) => setProfile({ ...profile, locationLabel: lower(event.target.value) })} /></label>
            </div>
            {mode === "beginner" && <span className="note">unknown time uses noon and keeps time-sensitive interpretation separate.</span>}
          </article>
        )}

        {section === "chart" && (
          <div className="pane-grid">
            <Balance title="element balance" items={elementBalance} help="what the chart leans on most." />
            <Balance title="modality balance" items={modalityBalance} help="how the chart starts, holds, and adapts." />
            <article className="wide-card">
              <p>placements</p>
              <div className="placement-grid">
                {placements.map((placement) => (
                  <div className="placement" key={placement.body}>
                    <strong>{lower(placement.body)}</strong>
                    <span>{placement.degree} deg {placement.minute}' {lower(placement.sign)}{placement.retrograde ? " / rx" : ""}</span>
                    <small>{lower(placement.element)} / {lower(placement.modality)}</small>
                  </div>
                ))}
              </div>
            </article>
          </div>
        )}

        {section === "timing" && <TaskGrid items={[
          ["transits", "watch current movement against natal placements."],
          ["calendar", "keep return dates, stations, and consultation windows."],
          ["notes", "separate timing notes from natal interpretation."]
        ]} />}

        {section === "journal" && (
          <article className="form-pane">
            <p>journal</p>
            <textarea value={journal} onChange={(event) => setJournal(lower(event.target.value))} />
            <span className="note">journal text stays private until you add it to a report.</span>
          </article>
        )}

        {section === "practice" && (
          <div className="pane-grid">
            <article className="form-pane">
              <p>client</p>
              <label>client name<input value={clientName} onChange={(event) => setClientName(lower(event.target.value))} /></label>
              <label>client email<input placeholder="client@example.com" /></label>
              <button>save client</button>
            </article>
            <TaskGrid items={[
              ["consent", "keep client-visible and private practitioner notes separate."],
              ["prep", "build a reading path from chart, timing, journal, and report sections."]
            ]} />
          </div>
        )}

        {section === "reports" && (
          <article className="report">
            <p>report</p>
            <h2>{profile.name}</h2>
            <span>{placements.length} placements, {elementBalance[0]?.[0]} emphasis, {modalityBalance[0]?.[0]} modality lead, and saved notes ready for report structure.</span>
            <div className="paper">
              <img src="/brand/fulllitelogo.svg" alt="dream logic astrology suite" />
              <h3>primary chart</h3>
              <p>{mode === "beginner" ? "plain-language meanings stay attached to technical sections." : "concise interpretation-forward export."}</p>
            </div>
          </article>
        )}

        {section === "plans" && (
          <div className="plans">
            {tiers.map(([name, price, detail, features]) => (
              <article className={tier === name ? "chosen" : ""} key={name}>
                <p>{name}</p>
                <h2>{price}</h2>
                <span>{detail}</span>
                <ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                <button onClick={() => name === "free" ? setTier("free") : checkout(name)} disabled={loading === name}>{loading === name ? "opening..." : name === "free" ? "use free" : "subscribe"}</button>
              </article>
            ))}
          </div>
        )}

        {section === "account" && (
          <div className="pane-grid">
            <article className="form-pane">
              <p>account</p>
              <label>email<input value={email} onChange={(event) => setEmail(lower(event.target.value))} placeholder="you@example.com" /></label>
              <label>password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="password" /></label>
              <div className="button-row">
                <button onClick={() => auth("login")} disabled={loading === "login"}>{loading === "login" ? "checking..." : "sign in"}</button>
                <button onClick={() => auth("signup")} disabled={loading === "signup"}>{loading === "signup" ? "creating..." : "create account"}</button>
              </div>
              <span className="note">{notice}</span>
            </article>
            <article>
              <p>current plan</p>
              <h2>{tier}</h2>
              <span>{tiers.find(([name]) => name === tier)?.[2]}</span>
              <button onClick={() => setSection("plans")}>manage plan</button>
            </article>
          </div>
        )}

        {mode === "beginner" && section !== "plans" && (
          <section className="meaning-bar">
            {glossary.map(([term, meaning]) => <article key={term}><strong>{term}</strong><span>{meaning}</span></article>)}
          </section>
        )}
      </section>

      <nav className="mobile-tabs" aria-label="mobile workspace">
        {nav.slice(0, 5).map(([key, label]) => <button className={section === key ? "on" : ""} key={key} onClick={() => setSection(key)}>{label}</button>)}
        <button className={section === "account" ? "on" : ""} onClick={() => setSection("account")}>account</button>
      </nav>
    </main>
  );
}

function Balance({ title, items, help }: { title: string; items: Array<[string, number]>; help?: string }) {
  return (
    <article>
      <p>{title}</p>
      {help && <span>{help}</span>}
      <div className="balance">
        {items.map(([name, count]) => <span key={name}><strong>{count}</strong>{name}</span>)}
      </div>
    </article>
  );
}

function TaskGrid({ items }: { items: string[][] }) {
  return (
    <div className="pane-grid">
      {items.map(([title, body]) => <article key={title}><p>{title}</p><span>{body}</span></article>)}
    </div>
  );
}
