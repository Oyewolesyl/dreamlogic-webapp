"use client";

import { useEffect, useMemo, useState } from "react";
import { BirthProfile, Placement, calculatePlacements } from "./chart";

type Tier = "free" | "seeker" | "depth" | "practitioner" | "practice" | "research";
type Mode = "beginner" | "expert";
type Section = "home" | "birth" | "chart" | "timing" | "journal" | "practice" | "reports" | "hypnos" | "plans" | "account";
type ReportSection = { title: string; body: string; items?: string[] };
type HypnosMessage = { role: "user" | "assistant"; text: string };

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
  ["hypnos", "hypnos"],
  ["plans", "plans"],
  ["account", "account"]
];

const mobilePrimaryNav: Array<[Section, string]> = [
  ["home", "today"],
  ["birth", "birth"],
  ["chart", "chart"],
  ["hypnos", "hypnos"],
  ["account", "account"]
];

const mobileMoreNav: Array<[Section, string]> = [
  ["reports", "report"],
  ["timing", "timing"],
  ["journal", "notes"],
  ["practice", "clients"],
  ["plans", "plans"]
];

const glossary = [
  ["element balance", "fire, earth, air, and water show what kind of energy repeats most."],
  ["modality balance", "cardinal, fixed, and mutable show how that energy moves."],
  ["retrograde", "a planet marked for review, return, or internal emphasis."],
  ["time certainty", "how much the birth time can be trusted before reading timing details."]
];

const guideText: Record<string, string> = {
  today: "today is the working desk. confirm the active chart, open the chart, prepare the report, save the workspace, or ask hypnos from here.",
  birth: "birth keeps the source data clean: date, time, place, and certainty. this protects every chart and report that follows.",
  chart: "chart shows the calculated placements and the balance patterns behind the reading.",
  timing: "timing is for transits, calendar notes, stations, and future consultation windows.",
  journal: "journal is private context. it stays out of the report and hypnos until you decide to include it.",
  clients: "clients is for practice work: client records, consent, and consultation preparation.",
  reports: "reports turns the chart, balance, and selected notes into a client-ready draft.",
  account: "account is where you sign in, save or restore the workspace, and manage plan access.",
  "element balance": "element balance counts fire, earth, air, and water across the main placements so the repeated tone of the chart is clear.",
  "modality balance": "modality balance counts cardinal, fixed, and mutable placements. it helps explain whether the chart starts, sustains, or adapts energy most often.",
  placements: "placements are the planet, sign, degree, element, modality, and retrograde status. this is the raw chart language before interpretation.",
  retrograde: "retrograde marks planets whose motion is read as review, return, internal emphasis, or delayed expression.",
  plans: "plans are separated by actual workflow: number of charts, timing depth, reports, client records, team seats, and research export.",
  "time certainty": "time certainty protects the reading. if the time is unknown, the app keeps timing-sensitive details separated.",
  hypnos: "hypnos ai reads the saved report context, placements, balance, journal note, and plan access before answering. free users can try it, paid plans unlock more room."
};

const sectionGuides: Record<Section, { title: string; body: string }> = {
  home: { title: "start here", body: "this is the active workspace. check the chart, save progress, prepare a report, or move into hypnos when you need an explanation." },
  birth: { title: "source data", body: "enter the birth record once. time certainty stays visible so beginners and practitioners know what can be trusted." },
  chart: { title: "calculated chart", body: "read the placements first, then use element and modality balance to see the larger pattern." },
  timing: { title: "timing notes", body: "keep transits, stations, dates, and consultation timing separate from the natal chart." },
  journal: { title: "private notes", body: "write context here before deciding whether it belongs in a report or hypnos prompt." },
  practice: { title: "client work", body: "save client records and keep private practitioner notes separate from client-facing language." },
  reports: { title: "report draft", body: "turn the active chart into a structured report, then download or save it to the workspace." },
  hypnos: { title: "hypnos ai", body: "ask questions using the current chart, report draft, journal note, and any imported report or workspace." },
  plans: { title: "plan access", body: "choose by workflow: saved charts, timing depth, reports, clients, team seats, or research export." },
  account: { title: "save and restore", body: "sign in to save charts, notes, clients, reports, plan state, and imported context." }
};

const confidenceText: Record<BirthProfile["birthTimeCertainty"], string> = {
  official_recorded: "high confidence for date and time based chart work.",
  family_reported: "good for placements; timing should be checked with care.",
  approximate: "good for placements; time-sensitive details need confirmation.",
  rectified: "usable for timing when the rectification method is trusted.",
  unknown: "placements use noon; time-sensitive claims stay separated."
};

const dataSourceNotes = [
  ["calculation", "planetary positions are calculated from date and time with astronomy-engine."],
  ["derived", "sign, degree, element, modality, and retrograde are derived from those longitudes."],
  ["guardrail", "birth-time certainty controls how strongly timing-sensitive reading is presented."]
];

const tourSteps = [
  ["start with birth data", "confirm the date, time, place, and time certainty. if the time is unknown, dream logic keeps timing-sensitive reading separate."],
  ["read the chart", "open chart to see placements, element balance, modality balance, and retrograde status. use explain when a term is unclear."],
  ["save your work", "save workspace writes the birth profile, chart snapshot, journal note, report draft, and restore state to supabase after sign in."],
  ["prepare a report", "reports turn the current chart, balances, and journal context into a draft you can save or download."],
  ["ask hypnos", "hypnos ai uses the saved report context to explain the reading and today's chart meaning. free access is limited; paid tiers get more room."]
] as const;

const hypnosLimits: Record<Tier, number> = {
  free: 3,
  seeker: 25,
  depth: 60,
  practitioner: 120,
  practice: 250,
  research: 500
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

const elementMeaning: Record<string, string> = {
  fire: "fire emphasis makes the chart move through direct impulse, appetite, urgency, courage, and visible self-expression.",
  earth: "earth emphasis makes the chart organize through proof, craft, money, maintenance, physical reality, and practical steadiness.",
  air: "air emphasis makes the chart process through language, pattern recognition, ideas, comparison, social exchange, and perspective.",
  water: "water emphasis makes the chart respond through memory, mood, intimacy, protection, instinct, and emotional intelligence."
};

const modalityMeaning: Record<string, string> = {
  cardinal: "cardinal emphasis starts motion. the person tends to initiate, decide, push doors open, and create the first movement.",
  fixed: "fixed emphasis sustains motion. the person tends to hold a line, deepen a position, protect continuity, and finish what matters.",
  mutable: "mutable emphasis adapts motion. the person tends to translate, revise, bridge differences, and keep changing with the situation."
};

const placementLine = (placement: Placement) =>
  `${lower(placement.body)}: ${placement.degree} deg ${placement.minute}' ${lower(placement.sign)}${placement.retrograde ? " / rx" : ""} / ${lower(placement.element)} / ${lower(placement.modality)}`;

const buildReportSections = (
  profile: BirthProfile,
  placements: Placement[],
  elementBalance: Array<[string, number]>,
  modalityBalance: Array<[string, number]>,
  journal: string,
  mode: Mode
): ReportSection[] => {
  const lead = placements[1] ?? placements[0];
  const strongestElement = elementBalance[0]?.[0] ?? "mixed";
  const strongestModality = modalityBalance[0]?.[0] ?? "mixed";
  const timeGuard = profile.birthTimeCertainty === "unknown"
    ? "birth time is unknown, so the chart is calculated from noon and timing-sensitive claims should stay clearly marked until the time is confirmed."
    : `birth time certainty is marked as ${profile.birthTimeCertainty.replaceAll("_", " ")}, so timing work can be read with that confidence level.`;

  return [
    {
      title: "chart record",
      body: `${profile.name} was calculated for ${profile.birthDate} at ${profile.birthTime} in ${profile.locationLabel}. ${timeGuard}`
    },
    {
      title: "lead placement",
      body: lead
        ? `${lower(lead.body)} in ${lower(lead.sign)} gives the first reading angle: ${lower(lead.element)} tone, ${lower(lead.modality)} movement${lead.retrograde ? ", with retrograde emphasis" : ""}.`
        : "lead placement is unavailable until the chart calculation returns placements."
    },
    {
      title: "element balance",
      body: `${strongestElement} is the strongest element in this chart. ${elementMeaning[strongestElement] ?? "the chart is evenly distributed, so no single element should dominate the interpretation."}`,
      items: elementBalance.map(([name, count]) => `${count} ${name}`)
    },
    {
      title: "modality balance",
      body: `${strongestModality} is the strongest modality in this chart. ${modalityMeaning[strongestModality] ?? "the chart moves through more than one style, so interpretation should compare initiation, persistence, and adaptation."}`,
      items: modalityBalance.map(([name, count]) => `${count} ${name}`)
    },
    {
      title: "placements",
      body: mode === "beginner"
        ? "these are the technical chart lines. the sign gives style, the element gives tone, and the modality gives movement."
        : "technical placement list for review.",
      items: placements.map(placementLine)
    },
    {
      title: "journal context",
      body: journal.trim() ? journal.trim() : "no private journal note has been added yet."
    },
    {
      title: "report note",
      body: "keep private notes separate from client-visible interpretation. use the report as a draft, then edit the final language before sharing."
    }
  ];
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
  const [guideOpen, setGuideOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [hypnosQuestion, setHypnosQuestion] = useState("what does this chart mean for today?");
  const [hypnosMessages, setHypnosMessages] = useState<HypnosMessage[]>([]);
  const [hypnosUses, setHypnosUses] = useState(0);
  const [importText, setImportText] = useState("");
  const [importedContext, setImportedContext] = useState("");
  const [importStatus, setImportStatus] = useState("no imported report yet.");

  const placements = useMemo(() => calculatePlacements(profile), [profile]);
  const elementBalance = useMemo(() => summarize(placements, "element"), [placements]);
  const modalityBalance = useMemo(() => summarize(placements, "modality"), [placements]);
  const reportSections = useMemo(
    () => buildReportSections(profile, placements, elementBalance, modalityBalance, journal, mode),
    [profile, placements, elementBalance, modalityBalance, journal, mode]
  );
  const leadPlacement = placements[1] ?? placements[0];
  const activeNav = nav.find(([key]) => key === section)?.[1] ?? "today";
  const hypnosRemaining = Math.max(0, hypnosLimits[tier] - hypnosUses);

  useEffect(() => {
    const savedSection = window.location.hash.replace("#", "") as Section;
    if (nav.some(([key]) => key === savedSection)) {
      setSection(savedSection);
    } else {
      const storedSection = window.localStorage.getItem("dreamlogic.section") as Section | null;
      if (storedSection && nav.some(([key]) => key === storedSection)) setSection(storedSection);
    }

    const tourSeen = window.localStorage.getItem("dreamlogic.tour.seen");
    if (!tourSeen) setShowTour(true);
  }, []);

  const goToSection = (next: Section) => {
    setSection(next);
    window.history.replaceState(null, "", `#${next}`);
    window.localStorage.setItem("dreamlogic.section", next);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const openGuide = (topic: string) => {
    setGuide(topic);
    setGuideOpen(true);
  };

  const finishTour = () => {
    window.localStorage.setItem("dreamlogic.tour.seen", "true");
    setShowTour(false);
  };

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
      if (intent === "login") await loadWorkspace(false);
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
      goToSection("account");
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

  const workspacePayload = () => ({
    profile,
    placements,
    elementBalance,
    modalityBalance,
    journal,
    clients,
    tier,
    mode,
    reportSections
  });

  const saveWorkspace = async () => {
    setLoading("save-workspace");
    setNotice("saving workspace...");
    try {
      const response = await fetch("/api/workspace", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(workspacePayload())
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "workspace save failed");
      setLastSavedAt(data.updatedAt);
      setNotice("workspace saved: birth profile, chart snapshot, journal note, and report draft are in supabase.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "workspace save failed";
      setNotice(message);
      if (message.includes("sign in") || message.includes("auth")) goToSection("account");
    } finally {
      setLoading("");
    }
  };

  const loadWorkspace = async (showNotice = true) => {
    setLoading("load-workspace");
    if (showNotice) setNotice("loading saved workspace...");
    try {
      const response = await fetch("/api/workspace");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "workspace load failed");
      if (!data.state) {
        setNotice("no saved workspace yet. save this chart after signing in.");
        return;
      }

      if (data.state.profile) setProfile(data.state.profile);
      if (data.state.journal) setJournal(data.state.journal);
      if (Array.isArray(data.state.clients)) setClients(data.state.clients);
      if (data.state.tier) setTier(data.state.tier);
      if (data.state.mode) setMode(data.state.mode);
      setLastSavedAt(data.updatedAt ?? data.state.updatedAt ?? "");
      setNotice("workspace loaded from supabase.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "workspace load failed");
    } finally {
      setLoading("");
    }
  };

  const applyImportedWorkspace = (text: string) => {
    const cleaned = text.trim();
    if (!cleaned) {
      setImportStatus("paste a report or workspace export first.");
      return;
    }

    try {
      const parsed = JSON.parse(cleaned);
      const state = parsed.state ?? parsed;
      if (state.profile) setProfile(state.profile);
      if (state.journal) setJournal(state.journal);
      if (Array.isArray(state.clients)) setClients(state.clients);
      if (state.tier) setTier(state.tier);
      if (state.mode) setMode(state.mode);
      setImportedContext(JSON.stringify(state.reportSections ?? state, null, 2));
      setImportStatus("workspace import loaded into hypnos context.");
      setNotice("workspace import is ready for hypnos.");
    } catch {
      setImportedContext(cleaned);
      setImportStatus("report text imported into hypnos context.");
      setNotice("report import is ready for hypnos.");
    }
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    setImportText(text);
    applyImportedWorkspace(text);
  };

  const downloadReport = () => {
    const lines = [
      "dream logic report",
      "",
      `chart: ${profile.name}`,
      `birth: ${profile.birthDate} / ${profile.birthTime} / ${profile.locationLabel}`,
      `time certainty: ${profile.birthTimeCertainty}`,
      "",
      ...reportSections.flatMap((section) => [
        section.title,
        section.body,
        ...(section.items ?? []),
        ""
      ])
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${profile.name.replace(/\s+/g, "-")}-dream-logic-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const askHypnos = async () => {
    const question = hypnosQuestion.trim();
    if (!question) return;
    if (hypnosRemaining <= 0) {
      setNotice("hypnos free limit reached for this session. choose a paid plan for more readings.");
      goToSection("plans");
      return;
    }

    const userMessage: HypnosMessage = { role: "user", text: question };
    setHypnosMessages((messages) => [...messages, userMessage]);
    setHypnosQuestion("");
    setLoading("hypnos");

    try {
      const response = await fetch("/api/hypnos", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tier,
          question,
          profile,
          placements,
          elementBalance,
          modalityBalance,
          reportSections,
          journal,
          importedContext
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "hypnos is unavailable");
      setHypnosMessages((messages) => [...messages, { role: "assistant", text: data.answer }]);
      setHypnosUses((uses) => uses + 1);
    } catch (error) {
      setHypnosMessages((messages) => [...messages, {
        role: "assistant",
        text: error instanceof Error ? error.message : "hypnos is unavailable"
      }]);
    } finally {
      setLoading("");
    }
  };

  return (
    <main className="app">
      <aside className="rail">
        <a className="logo" href={landingUrl}>
          <AssetImage src="/brand/logomain.svg" alt="dream logic" />
        </a>
        <nav aria-label="workspace">
          {nav.map(([key, label]) => (
            <button className={section === key ? "on" : ""} key={key} onClick={() => goToSection(key)}>{label}</button>
          ))}
        </nav>
      </aside>

      <section className="work">
        <header className="worktop">
          <a className="mobile-logo" href={landingUrl}>
            <AssetImage src="/brand/logomain.svg" alt="dream logic" />
          </a>
          <div>
            <p>dream logic</p>
            <h1>{activeNav}</h1>
          </div>
          <div className="tools">
            <button className={mode === "beginner" ? "on" : ""} onClick={() => setMode("beginner")}>beginner</button>
            <button className={mode === "expert" ? "on" : ""} onClick={() => setMode("expert")}>expert</button>
            <button onClick={() => setShowTour(true)}>tour</button>
            <a href={landingUrl}>landing</a>
            <button onClick={() => goToSection("account")}>sign in</button>
          </div>
          <div className="mobile-switch" aria-label="more workspace sections">
            {mobileMoreNav.map(([key, label]) => (
              <button className={section === key ? "on" : ""} key={key} onClick={() => goToSection(key)}>{label}</button>
            ))}
          </div>
        </header>

        {(notice || lastSavedAt) && (
          <section className="status-strip" aria-live="polite">
            <span>{notice}</span>
            {lastSavedAt && <strong>saved {new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>}
          </section>
        )}

        <section className="screen-guide">
          <div>
            <p>{sectionGuides[section].title}</p>
            <span>{sectionGuides[section].body}</span>
          </div>
          <button onClick={() => openGuide(section === "home" ? "today" : activeNav)}>guide</button>
        </section>

        {section === "home" && (
          <div className="pane-grid">
            <article className="active-chart">
              <AssetImage src="/brand/logomain.svg" alt="dream logic" />
              <div>
                <p>active chart</p>
                <h2>{profile.name}</h2>
                <span>{profile.birthDate} / {profile.birthTime} / {profile.locationLabel}</span>
              </div>
              <div className="action-grid">
                <ActionButton label="edit birth data" detail="date, time, place, certainty" onClick={() => goToSection("birth")} tone="primary" />
                <ActionButton label="open chart" detail="placements and balance" onClick={() => goToSection("chart")} />
                <ActionButton label="prepare report" detail="build the reading draft" onClick={() => goToSection("reports")} />
                <ActionButton label={loading === "save-workspace" ? "saving..." : "save workspace"} detail="store chart, notes, clients, report" onClick={saveWorkspace} disabled={loading === "save-workspace"} />
              </div>
            </article>
            <article>
              <p>focus</p>
              <h2>{lower(leadPlacement.body)} in {lower(leadPlacement.sign)}</h2>
              <span>{mode === "beginner" ? "start here, then check element and modality balance." : "use this as the lead angle, then verify with balance and timing."}</span>
            </article>
            <article className="trust-card">
              <p>reading confidence</p>
              <h2>{profile.birthTimeCertainty.replaceAll("_", " ")}</h2>
              <span>{confidenceText[profile.birthTimeCertainty]}</span>
              <div className="trust-list">
                {dataSourceNotes.map(([title, body]) => <span key={title}><strong>{title}</strong>{body}</span>)}
              </div>
            </article>
            <Balance title="element balance" items={elementBalance} onGuide={() => openGuide("element balance")} />
            <Balance title="modality balance" items={modalityBalance} onGuide={() => openGuide("modality balance")} />
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
            {mode === "beginner" && <button className="note help-button" onClick={() => openGuide("time certainty")}>unknown time uses noon. timing-sensitive details stay separated.</button>}
          </article>
        )}

        {section === "chart" && (
          <div className="pane-grid">
            <Balance title="element balance" items={elementBalance} help="the repeated energy in the chart." onGuide={() => openGuide("element balance")} />
            <Balance title="modality balance" items={modalityBalance} help="the way that energy moves." onGuide={() => openGuide("modality balance")} />
            <article className="trust-card">
              <div className="card-title"><p>source check</p><button onClick={() => openGuide("time certainty")}>certainty</button></div>
              <span>this chart uses astronomical longitudes first. interpretation begins after the placements are calculated.</span>
              <div className="trust-list">
                {dataSourceNotes.map(([title, body]) => <span key={title}><strong>{title}</strong>{body}</span>)}
              </div>
            </article>
            <article className="wide-card">
              <div className="card-title"><p>placements</p><button onClick={() => openGuide("placements")}>what is this?</button></div>
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
            <div className="report-confidence">
              <strong>source note</strong>
              <span>calculated placements first. interpretation second. time certainty: {profile.birthTimeCertainty.replaceAll("_", " ")}.</span>
            </div>
            <div className="paper">
              <AssetImage src="/brand/fulllitelogo.svg" alt="dream logic astrology suite" />
              <h3>primary chart</h3>
              <p>{mode === "beginner" ? "technical chart lines are paired with plain-language meaning." : "compact technical report with interpretation anchors."}</p>
              <div className="report-sections">
                {reportSections.map((part) => (
                  <section key={part.title}>
                    <h4>{part.title}</h4>
                    <p>{part.body}</p>
                    {part.items && <ul>{part.items.map((item) => <li key={item}>{item}</li>)}</ul>}
                  </section>
                ))}
              </div>
            </div>
            <div className="button-row">
              <button onClick={downloadReport}>download report</button>
              <button onClick={saveWorkspace} disabled={loading === "save-workspace"}>{loading === "save-workspace" ? "saving..." : "save report"}</button>
              <button onClick={() => { setGuideOpen(false); goToSection("hypnos"); }}>ask hypnos</button>
            </div>
          </article>
        )}

        {section === "hypnos" && (
          <div className="pane-grid hypnos-grid">
            <article className="hypnos-panel">
              <p>hypnos ai</p>
              <h2>ask about the chart</h2>
              <span>hypnos reads the current report draft, placements, balance, and journal context. free tier has {hypnosLimits.free} tries per session; your current {tier} limit is {hypnosLimits[tier]}.</span>
              <div className="import-box">
                <p>import report or workspace</p>
                <textarea
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  placeholder="paste a dream logic report, notes, or workspace json here"
                />
                <div className="button-row compact-actions">
                  <button className="secondary-button" onClick={() => applyImportedWorkspace(importText)}>use pasted import</button>
                  <label className="file-button">
                    upload file
                    <input accept=".txt,.json,.md" onChange={(event) => importFile(event.target.files?.[0])} type="file" />
                  </label>
                </div>
                <span>{importStatus}</span>
              </div>
              <div className="report-confidence">
                <strong>hypnos context</strong>
                <span>answers use current placements, report draft, journal note, and imported context when supplied.</span>
              </div>
              <div className="hypnos-thread">
                {hypnosMessages.length === 0 && <span className="empty-thread">ask what the chart means, what to focus on today, or how to explain a report section.</span>}
                {hypnosMessages.map((message, index) => (
                  <div className={`hypnos-message ${message.role}`} key={`${message.role}-${index}`}>
                    <strong>{message.role === "user" ? "you" : "hypnos"}</strong>
                    <span>{message.text}</span>
                  </div>
                ))}
              </div>
              <textarea value={hypnosQuestion} onChange={(event) => setHypnosQuestion(event.target.value)} />
              <div className="button-row">
                <button className="primary-button" onClick={askHypnos} disabled={loading === "hypnos"}>{loading === "hypnos" ? "reading..." : "ask hypnos"}</button>
                <button className="secondary-button" onClick={saveWorkspace} disabled={loading === "save-workspace"}>save context</button>
              </div>
              <span className="note">{hypnosRemaining} hypnos asks left on {tier}.</span>
            </article>
            <article>
              <p>active report context</p>
              <h2>{profile.name}</h2>
              <span>{reportSections[1]?.body}</span>
              <div className="report-lines compact-lines">
                {reportSections.slice(2, 5).map((part) => <span key={part.title}>{part.title}: {part.body}</span>)}
              </div>
            </article>
          </div>
        )}

        {section === "plans" && (
          <div className="plans">
            {tiers.map(([name, price, label, limit, features]) => (
              <article className={tier === name ? "chosen" : ""} key={name}>
                <p>{name}</p>
                <h2>{price}</h2>
                <span>{label} / {limit}</span>
                <ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                <button className="plain-button" onClick={() => openGuide("plans")}>why this plan?</button>
                <button onClick={() => name === "free" ? setTier("free") : checkout(name)} disabled={loading === name}>{loading === name ? "opening..." : name === "free" ? "try free" : "subscribe"}</button>
              </article>
            ))}
          </div>
        )}

        {section === "account" && (
          <div className="pane-grid account-grid">
            <article className="form-pane account-pane">
              <p>account</p>
              <label>email<input value={email} onChange={(event) => setEmail(lower(event.target.value))} placeholder="you@example.com" /></label>
              <label>password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="password" /></label>
              <div className="button-row account-actions">
                <button className="primary-button" onClick={() => auth("login")} disabled={loading === "login"}>{loading === "login" ? "checking..." : "sign in"}</button>
                <button className="secondary-button" onClick={() => auth("signup")} disabled={loading === "signup"}>{loading === "signup" ? "creating..." : "create account"}</button>
              </div>
              <div className="button-row account-actions">
                <button className="secondary-button" onClick={saveWorkspace} disabled={loading === "save-workspace"}>{loading === "save-workspace" ? "saving..." : "save workspace"}</button>
                <button className="secondary-button" onClick={() => loadWorkspace()} disabled={loading === "load-workspace"}>{loading === "load-workspace" ? "loading..." : "load workspace"}</button>
              </div>
              <span className="note">{notice}</span>
              {lastSavedAt && <span className="note">last saved {new Date(lastSavedAt).toLocaleString()}</span>}
            </article>
            <article className="account-plan">
              <p>current plan</p>
              <h2>{tier}</h2>
              <span>{tiers.find(([name]) => name === tier)?.[3]}</span>
              <button className="secondary-button" onClick={() => goToSection("plans")}>manage plan</button>
            </article>
          </div>
        )}

        {mode === "beginner" && section !== "plans" && (
          <section className="meaning-bar">
            {glossary.map(([term, meaning]) => <article key={term}><strong>{term}</strong><span>{meaning}</span></article>)}
          </section>
        )}

        {guideOpen && (
          <aside className="guide-sheet" aria-live="polite" role="dialog" aria-label={`${guide} guide`}>
            <div>
              <p>guide</p>
              <h2>{guide}</h2>
              <span>{guideText[guide]}</span>
            </div>
            <div className="button-row">
              <button onClick={() => setGuideOpen(false)}>close</button>
              <button onClick={() => goToSection("hypnos")}>ask hypnos</button>
            </div>
          </aside>
        )}

        {showTour && (
          <aside className="tour-layer" role="dialog" aria-label="dream logic tour">
            <div className="tour-card">
              <p>first run</p>
              <h2>{tourSteps[tourStep][0]}</h2>
              <span>{tourSteps[tourStep][1]}</span>
              <div className="tour-progress">
                {tourSteps.map((_, index) => <i className={index === tourStep ? "on" : ""} key={index} />)}
              </div>
              <div className="button-row">
                <button onClick={finishTour}>skip</button>
                <button onClick={() => tourStep === tourSteps.length - 1 ? finishTour() : setTourStep((step) => step + 1)}>
                  {tourStep === tourSteps.length - 1 ? "start" : "next"}
                </button>
              </div>
            </div>
          </aside>
        )}
      </section>

      <nav className="mobile-tabs" aria-label="mobile workspace">
        {mobilePrimaryNav.map(([key, label]) => <button className={section === key ? "on" : ""} key={key} onClick={() => goToSection(key)}>{label}</button>)}
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

function AssetImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span className={`asset-frame ${loaded ? "loaded" : ""}`}>
      <img src={src} alt={alt} onLoad={() => setLoaded(true)} />
    </span>
  );
}

function ActionButton({ label, detail, onClick, disabled, tone }: { label: string; detail: string; onClick: () => void; disabled?: boolean; tone?: "primary" }) {
  return (
    <button className={`action-button ${tone === "primary" ? "primary" : ""}`} disabled={disabled} onClick={onClick}>
      <strong>{label}</strong>
      <span>{detail}</span>
    </button>
  );
}

function TaskGrid({ items }: { items: string[][] }) {
  return (
    <div className="pane-grid">
      {items.map(([title, body]) => <article key={title}><p>{title}</p><span>{body}</span></article>)}
    </div>
  );
}
