"use client";

import { useMemo, useState } from "react";
import { BirthProfile, Placement, calculatePlacements } from "./chart";

type Tier = "free" | "seeker" | "depth" | "practitioner" | "practice" | "research";
type Mode = "beginner" | "expert";
type Section = "home" | "birth" | "chart" | "timing" | "journal" | "practice" | "reports" | "plans" | "account";

const tiers: Array<[Tier, string, string, string, string[]]> = [
  ["free", "$0", "start", "1 chart", ["birth profile", "placements", "element balance", "modality balance", "beginner meanings"]],
  ["seeker", "$9/mo", "personal", "10 charts", ["saved profiles", "journal links", "monthly timing", "relationship notes", "basic reports"]],
  ["depth", "$19/mo", "deep work", "50 charts", ["returns", "advanced timing", "chart collections", "longer interpretation", "comparison work"]],
  ["practitioner", "$39/mo", "client work", "100 clients", ["client records", "consent", "private notes", "report export", "session prep"]],
  ["practice", "$89/mo", "team", "5 seats", ["shared clients", "team records", "practice overview", "support workflow", "role access"]],
  ["research", "$149/mo", "research", "bulk", ["bulk charts", "csv exports", "datasets", "research notebooks", "method notes"]]
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

const mobilePrimaryNav: Array<[Section, string]> = [
  ["home", "today"],
  ["birth", "birth"],
  ["chart", "chart"],
  ["journal", "notes"],
  ["reports", "report"]
];

const glossary = [
  ["element balance", "fire, earth, air, and water show what kind of energy repeats most."],
  ["modality balance", "cardinal, fixed, and mutable show how that energy moves."],
  ["retrograde", "a planet marked for review, return, or internal emphasis."],
  ["time certainty", "how much the birth time can be trusted before reading timing details."]
];

const guideText: Record<string, string> = {
  "element balance": "element balance counts fire, earth, air, and water across the main placements so the repeated tone of the chart is clear.",
  "modality balance": "modality balance counts cardinal, fixed, and mutable placements. it helps explain whether the chart starts, sustains, or adapts energy most often.",
  placements: "placements are the planet, sign, degree, element, modality, and retrograde status. this is the raw chart language before interpretation.",
  retrograde: "retrograde marks planets whose motion is read as review, return, internal emphasis, or delayed expression.",
  plans: "plans are separated by actual workflow: number of charts, timing depth, reports, client records, team seats, and research export.",
  "time certainty": "time certainty protects the reading. if the time is unknown, the app keeps timing-sensitive details separated."
};

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
  const [journal, setJournal] = useState("moon notes: keep the emotional read precise before adding it to the report.");
  const [clientName, setClientName] = useState("consultation client");
  const [clients, setClients] = useState(["consultation client"]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("sign in or create an account to save charts, notes, clients, and reports.");
  const [loading, setLoading] = useState("");
  const [guide, setGuide] = useState("plans");

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

  const saveClient = () => {
    const next = lower(clientName.trim());
    if (!next) return;
    setClients((all) => Array.from(new Set([next, ...all])));
    setNotice(`${next} saved to client records.`);
  };

  const downloadReport = () => {
    const lines = [
      "dream logic report",
      "",
      `chart: ${profile.name}`,
      `birth: ${profile.birthDate} / ${profile.birthTime} / ${profile.locationLabel}`,
      `time certainty: ${profile.birthTimeCertainty}`,
      "",
      "placements",
      ...placements.map((placement) => `${lower(placement.body)}: ${placement.degree} deg ${placement.minute}' ${lower(placement.sign)}${placement.retrograde ? " / rx" : ""} / ${lower(placement.element)} / ${lower(placement.modality)}`),
      "",
      "journal",
      journal
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.name.replace(/\s+/g, "-")}-dream-logic-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
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
          <label className="mobile-switch">
            <span>go to</span>
            <select value={section} onChange={(event) => setSection(event.target.value as Section)}>
              {nav.map(([key, label]) => <option value={key} key={key}>{label}</option>)}
            </select>
          </label>
        </header>

        {section === "home" && (
          <div className="pane-grid">
            <article className="active-chart">
              <img src="/brand/logomain.svg" alt="dream logic" />
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
              <p>focus</p>
              <h2>{lower(leadPlacement.body)} in {lower(leadPlacement.sign)}</h2>
              <span>{mode === "beginner" ? "start here, then check element and modality balance." : "use this as the lead angle, then verify with balance and timing."}</span>
            </article>
            <Balance title="element balance" items={elementBalance} onGuide={() => setGuide("element balance")} />
            <Balance title="modality balance" items={modalityBalance} onGuide={() => setGuide("modality balance")} />
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
            {mode === "beginner" && <button className="note help-button" onClick={() => setGuide("time certainty")}>unknown time uses noon. timing-sensitive details stay separated.</button>}
          </article>
        )}

        {section === "chart" && (
          <div className="pane-grid">
            <Balance title="element balance" items={elementBalance} help="the repeated energy in the chart." onGuide={() => setGuide("element balance")} />
            <Balance title="modality balance" items={modalityBalance} help="the way that energy moves." onGuide={() => setGuide("modality balance")} />
            <article className="wide-card">
              <div className="card-title"><p>placements</p><button onClick={() => setGuide("placements")}>what is this?</button></div>
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
          ["transits", "compare current movement with natal placements."],
          ["calendar", "save return dates, stations, and consultation windows."],
          ["notes", "keep timing notes separate from natal meaning."]
        ]} />}

        {section === "journal" && (
          <article className="form-pane">
            <p>journal</p>
            <textarea value={journal} onChange={(event) => setJournal(lower(event.target.value))} />
            <span className="note">journal text stays private until you choose to use it.</span>
          </article>
        )}

        {section === "practice" && (
          <div className="pane-grid">
            <article className="form-pane">
              <p>client</p>
              <label>client name<input value={clientName} onChange={(event) => setClientName(lower(event.target.value))} /></label>
              <label>client email<input placeholder="client@example.com" /></label>
              <button onClick={saveClient}>save client</button>
            </article>
            <article>
              <p>saved clients</p>
              <div className="client-list">
                {clients.map((client) => <span key={client}>{client}</span>)}
              </div>
            </article>
            <TaskGrid items={[
              ["consent", "separate client-visible notes from private notes."],
              ["prep", "move from chart to timing to notes to report."]
            ]} />
          </div>
        )}

        {section === "reports" && (
          <article className="report">
            <p>report</p>
            <h2>{profile.name}</h2>
            <span>{placements.length} placements, {elementBalance[0]?.[0]} emphasis, {modalityBalance[0]?.[0]} modality lead, and saved notes ready.</span>
            <div className="paper">
              <img src="/brand/fulllitelogo.svg" alt="dream logic astrology suite" />
              <h3>primary chart</h3>
              <p>{mode === "beginner" ? "meanings stay beside the technical sections." : "shorter export for experienced readers."}</p>
              <div className="report-lines">
                <span>{leadPlacement ? `${lower(leadPlacement.body)} in ${lower(leadPlacement.sign)}` : "chart lead unavailable"}</span>
                <span>{elementBalance[0]?.[0]} emphasis</span>
                <span>{modalityBalance[0]?.[0]} modality lead</span>
              </div>
            </div>
            <button onClick={downloadReport}>download report</button>
          </article>
        )}

        {section === "plans" && (
          <div className="plans">
            {tiers.map(([name, price, label, limit, features]) => (
              <article className={tier === name ? "chosen" : ""} key={name}>
                <p>{name}</p>
                <h2>{price}</h2>
                <span>{label} / {limit}</span>
                <ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                <button className="plain-button" onClick={() => setGuide("plans")}>why this plan?</button>
                <button onClick={() => name === "free" ? setTier("free") : checkout(name)} disabled={loading === name}>{loading === name ? "opening..." : name === "free" ? "try free" : "subscribe"}</button>
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
              <span>{tiers.find(([name]) => name === tier)?.[3]}</span>
              <button onClick={() => setSection("plans")}>manage plan</button>
            </article>
          </div>
        )}

        {mode === "beginner" && section !== "plans" && (
          <section className="meaning-bar">
            {glossary.map(([term, meaning]) => <article key={term}><strong>{term}</strong><span>{meaning}</span></article>)}
          </section>
        )}

        {mode === "beginner" && (
          <aside className="guide-panel" aria-live="polite">
            <div>
              <p>guide</p>
              <h2>{guide}</h2>
              <span>{guideText[guide]}</span>
            </div>
            <button onClick={() => setMode("expert")}>hide guide</button>
          </aside>
        )}
      </section>

      <nav className="mobile-tabs" aria-label="mobile workspace">
        {mobilePrimaryNav.map(([key, label]) => <button className={section === key ? "on" : ""} key={key} onClick={() => setSection(key)}>{label}</button>)}
      </nav>
    </main>
  );
}

function Balance({ title, items, help, onGuide }: { title: string; items: Array<[string, number]>; help?: string; onGuide?: () => void }) {
  return (
    <article>
      <div className="card-title">
        <p>{title}</p>
        {onGuide && <button onClick={onGuide}>explain</button>}
      </div>
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
