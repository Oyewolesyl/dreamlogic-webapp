"use client";

import { useMemo, useState } from "react";
import { BirthProfile, Placement, calculatePlacements } from "./chart";

type Tier = "free" | "seeker" | "depth" | "practitioner" | "practice" | "research";
type Mode = "beginner" | "expert";
type Section = "today" | "birth" | "chart" | "timing" | "journal" | "practice" | "reports" | "pricing" | "account";

const tierOrder: Tier[] = ["free", "seeker", "depth", "practitioner", "practice", "research"];

const tierDetails: Record<Tier, { price: string; detail: string; features: string[] }> = {
  free: { price: "$0", detail: "one saved chart with plain explanations", features: ["one birth profile", "basic placements", "beginner glossary"] },
  seeker: { price: "$9", detail: "personal chart work and timing notes", features: ["multiple profiles", "journal links", "monthly transits"] },
  depth: { price: "$19", detail: "deeper timing, returns, and comparison", features: ["solar return prep", "synastry notes", "advanced timing"] },
  practitioner: { price: "$39", detail: "client-ready work for one astrologer", features: ["client records", "private notes", "exportable reports"] },
  practice: { price: "$89", detail: "shared workflows for teams", features: ["team access", "consent records", "practice reporting"] },
  research: { price: "$149", detail: "bulk charts and structured datasets", features: ["bulk calculation", "csv exports", "research notebooks"] }
};

const glossary = [
  ["natal chart", "a map of planetary positions for a specific birth date, time, and place."],
  ["element balance", "how much fire, earth, air, and water appear across the main placements."],
  ["modality balance", "how much cardinal, fixed, and mutable energy appears across the main placements."],
  ["retrograde", "a planet appearing to move backward from earth, often read as internalized or revisited themes."],
  ["time certainty", "how reliable the birth time is; unknown times use noon and keep time-sensitive meaning separated."]
];

const nav: Array<[Section, string, string]> = [
  ["today", "today", "current chart and next action"],
  ["birth", "birth profile", "date, time, place, certainty"],
  ["chart", "chart studio", "placements and balances"],
  ["timing", "timing", "transits and planning"],
  ["journal", "journal", "notes tied to chart context"],
  ["practice", "practice", "clients and consent"],
  ["reports", "reports", "export-ready interpretation"],
  ["pricing", "pricing", "subscription access"],
  ["account", "account", "sign in and workspace access"]
];

const defaultProfile: BirthProfile = {
  name: "primary chart",
  birthDate: "1994-06-17",
  birthTime: "09:30",
  birthTimeCertainty: "official_recorded",
  locationLabel: "lagos, nigeria"
};

const lowercase = (value: string) => value.toLowerCase();

const summarize = (placements: Placement[], field: "element" | "modality") => {
  const counts = placements.reduce<Record<string, number>>((all, placement) => {
    const key = lowercase(placement[field]);
    all[key] = (all[key] ?? 0) + 1;
    return all;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
};

export default function DreamLogicWorkspace() {
  const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL ?? "https://dreamlogic-landingpage.vercel.app";
  const [profile, setProfile] = useState<BirthProfile>(defaultProfile);
  const [section, setSection] = useState<Section>("today");
  const [mode, setMode] = useState<Mode>("beginner");
  const [tier, setTier] = useState<Tier>("seeker");
  const [journal, setJournal] = useState("moon notes: watch emotional pacing before interpretation.");
  const [clientName, setClientName] = useState("consultation client");
  const [email, setEmail] = useState("reader@dreamlogic.app");
  const [accountNotice, setAccountNotice] = useState("charts, notes, clients, and reports stay attached to this workspace.");

  const placements = useMemo(() => calculatePlacements(profile), [profile]);
  const elementBalance = useMemo(() => summarize(placements, "element"), [placements]);
  const modalityBalance = useMemo(() => summarize(placements, "modality"), [placements]);
  const topPlacement = placements[1] ?? placements[0];
  const isBeginner = mode === "beginner";

  return (
    <main className="workspace">
      <aside className="sidebar">
        <div className="brand-lockup">
          <img src="/brand/logomain.svg" alt="dream logic" />
        </div>
        <div className="account-card">
          <p>workspace</p>
          <strong>{profile.name}</strong>
          <span>{tierDetails[tier].detail}</span>
          <div className="account-links">
            <a href={landingUrl}>landing site</a>
            <button onClick={() => setSection("account")}>account</button>
          </div>
        </div>
        <nav aria-label="workspace">
          {nav.map(([key, label, detail]) => (
            <button className={section === key ? "active" : ""} key={key} onClick={() => setSection(key)}>
              <span>{label}</span>
              <small>{detail}</small>
            </button>
          ))}
        </nav>
      </aside>

      <section className="main-panel">
        <header className="topline">
          <div>
            <p>astrology workspace</p>
            <h1>{nav.find(([key]) => key === section)?.[1]}</h1>
          </div>
          <div className="top-actions">
            <a href={landingUrl}>landing</a>
            <button onClick={() => setSection("pricing")}>pricing</button>
            <details className="app-menu">
              <summary>menu</summary>
              {nav.map(([key, label]) => <button key={key} onClick={() => setSection(key)}>{label}</button>)}
              <a href={landingUrl}>landing site</a>
            </details>
            <div className="mode-switch" aria-label="reading mode">
              <button className={mode === "beginner" ? "selected" : ""} onClick={() => setMode("beginner")}>beginner</button>
              <button className={mode === "expert" ? "selected" : ""} onClick={() => setMode("expert")}>expert</button>
            </div>
          </div>
        </header>

        {section === "today" && (
          <div className="screen-grid">
            <article className="hero-card">
              <img src="/brand/fulllitelogo.svg" alt="dream logic astrology suite" />
              <div>
                <p>active chart</p>
                <h2>{profile.name}</h2>
                <span>{profile.birthDate} / {profile.birthTime} / {profile.locationLabel}</span>
              </div>
              <div className="actions">
                <button onClick={() => setSection("birth")}>edit birth data</button>
                <button onClick={() => setSection("chart")}>open chart</button>
                <button onClick={() => setSection("reports")}>prepare report</button>
              </div>
            </article>
            <article>
              <p className="kicker">next useful read</p>
              <h2>{lowercase(topPlacement.body)} in {lowercase(topPlacement.sign)}</h2>
              <p>{isBeginner ? "start with one placement, then read it beside element balance and modality balance so the chart feels understandable instead of scattered." : "use the leading placement as the report angle, then confirm it against balance and timing."}</p>
            </article>
          </div>
        )}

        {section === "birth" && (
          <article className="form-card">
            <p className="kicker">birth data</p>
            <div className="form-grid">
              <label>profile name<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value.toLowerCase() })} /></label>
              <label>birth date<input type="date" value={profile.birthDate} onChange={(event) => setProfile({ ...profile, birthDate: event.target.value })} /></label>
              <label>birth time<input type="time" value={profile.birthTime} onChange={(event) => setProfile({ ...profile, birthTime: event.target.value })} /></label>
              <label>time certainty<select value={profile.birthTimeCertainty} onChange={(event) => setProfile({ ...profile, birthTimeCertainty: event.target.value as BirthProfile["birthTimeCertainty"] })}>
                <option value="official_recorded">official recorded time</option>
                <option value="family_reported">family reported</option>
                <option value="approximate">approximate</option>
                <option value="rectified">rectified</option>
                <option value="unknown">unknown</option>
              </select></label>
              <label className="wide">birth location<input value={profile.locationLabel} onChange={(event) => setProfile({ ...profile, locationLabel: event.target.value.toLowerCase() })} /></label>
            </div>
            {isBeginner && <p className="note">unknown birth times calculate from noon and keep moon, houses, and timing-sensitive interpretation clearly marked.</p>}
          </article>
        )}

        {section === "chart" && (
          <div className="screen-grid">
            <Balance title="element balance" items={elementBalance} help={isBeginner ? "elements describe the style of expression across the chart." : undefined} />
            <Balance title="modality balance" items={modalityBalance} help={isBeginner ? "modalities describe how the chart initiates, holds, and adapts energy." : undefined} />
            <article className="wide-card">
              <p className="kicker">placements</p>
              <div className="placement-list">
                {placements.map((placement) => (
                  <div className="placement" key={placement.body}>
                    <strong>{lowercase(placement.body)}</strong>
                    <span>{placement.degree} deg {placement.minute}' {lowercase(placement.sign)}{placement.retrograde ? " / rx" : ""}</span>
                    <small>{lowercase(placement.element)} / {lowercase(placement.modality)}</small>
                  </div>
                ))}
              </div>
            </article>
          </div>
        )}

        {section === "timing" && (
          <div className="screen-grid">
            <Task title="transit watch" body="track current motion against natal placements without mixing it into the natal report." />
            <Task title="calendar planning" body="save consultation windows, return dates, and follow-up prompts." />
            <Task title="station notes" body="mark retrograde station periods and keep interpretation separate from natal meaning." />
          </div>
        )}

        {section === "journal" && (
          <article className="form-card">
            <p className="kicker">private journal</p>
            <textarea value={journal} onChange={(event) => setJournal(event.target.value.toLowerCase())} />
            <p className="note">journal text stays private until you deliberately add it to a report.</p>
          </article>
        )}

        {section === "practice" && (
          <div className="screen-grid">
            <article className="form-card">
              <p className="kicker">client record</p>
              <label>client name<input value={clientName} onChange={(event) => setClientName(event.target.value.toLowerCase())} /></label>
              <label>email<input placeholder="client@example.com" /></label>
              <button className="primary-button">save client</button>
            </article>
            <Task title="consent" body="client-visible notes and practitioner-private notes remain separated before export." />
            <Task title="session prep" body="build a clean consultation path from profile, timing, journal, and relationship work." />
          </div>
        )}

        {section === "reports" && (
          <article className="report-card">
            <p className="kicker">report draft</p>
            <h2>{profile.name}</h2>
            <p>{placements.length} calculated placements, {elementBalance[0]?.[0]} emphasis, {modalityBalance[0]?.[0]} modality lead, saved journal context, and practitioner notes are ready for export.</p>
            <div className="report-strip">
              <button>birth profile</button>
              <button>interpretation</button>
              <button>practice notes</button>
            </div>
            <div className="paper-preview">
              <img src="/brand/fulllitelogo.svg" alt="dream logic astrology suite" />
              <h3>primary chart</h3>
              <p>{isBeginner ? "includes plain-language definitions before each technical section." : "keeps report concise and interpretation-forward."}</p>
            </div>
          </article>
        )}

        {section === "pricing" && (
          <div className="tier-grid">
            {tierOrder.map((name) => (
              <article className={tier === name ? "tier chosen" : "tier"} key={name}>
                <p className="kicker">{name}</p>
                <h2>{tierDetails[name].price}</h2>
                <span>{tierDetails[name].detail}</span>
                <ul>{tierDetails[name].features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                <button onClick={() => setTier(name)}>{tier === name ? "current plan" : "choose plan"}</button>
              </article>
            ))}
          </div>
        )}

        {section === "account" && (
          <div className="screen-grid">
            <article className="form-card">
              <p className="kicker">account access</p>
              <label>email<input value={email} onChange={(event) => setEmail(event.target.value.toLowerCase())} /></label>
              <label>password<input type="password" placeholder="password" /></label>
              <button className="primary-button" onClick={() => setAccountNotice(`access checked for ${email.toLowerCase()}`)}>continue</button>
              <p className="note">{accountNotice}</p>
            </article>
            <article>
              <p className="kicker">current access</p>
              <h2>{tier}</h2>
              <p>{tierDetails[tier].detail}</p>
              <button className="link-button" onClick={() => setSection("pricing")}>change plan</button>
            </article>
          </div>
        )}

        {isBeginner && section !== "pricing" && (
          <section className="glossary">
            <p className="kicker">quick meanings</p>
            <div>
              {glossary.map(([term, meaning]) => <article key={term}><strong>{term}</strong><span>{meaning}</span></article>)}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function Balance({ title, items, help }: { title: string; items: Array<[string, number]>; help?: string }) {
  return (
    <article>
      <p className="kicker">{title}</p>
      {help && <p>{help}</p>}
      <div className="balance-grid">
        {items.map(([name, count]) => <span key={name}><strong>{count}</strong>{name}</span>)}
      </div>
    </article>
  );
}

function Task({ title, body }: { title: string; body: string }) {
  return (
    <article>
      <p className="kicker">{title}</p>
      <p>{body}</p>
    </article>
  );
}
