import { NextRequest, NextResponse } from "next/server";

type Placement = {
  body: string;
  sign: string;
  degree: number;
  minute: number;
  element: string;
  modality: string;
  retrograde?: boolean;
};

type ReportSection = { title: string; body: string; items?: string[] };

const planLimit: Record<string, number> = {
  free: 3,
  seeker: 25,
  depth: 60,
  practitioner: 120,
  practice: 250,
  research: 500
};

const compact = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 1600);
};

const localAnswer = (
  question: string,
  placements: Placement[],
  elementBalance: Array<[string, number]>,
  modalityBalance: Array<[string, number]>,
  reportSections: ReportSection[]
) => {
  const moon = placements.find((placement) => placement.body.toLowerCase() === "moon") ?? placements[1] ?? placements[0];
  const leadElement = elementBalance[0];
  const leadModality = modalityBalance[0];
  const leadReport = reportSections.find((section) => section.title === "lead placement") ?? reportSections[0];

  return [
    `for this question: "${question}"`,
    "",
    moon
      ? `start with ${moon.body.toLowerCase()} in ${moon.sign.toLowerCase()}. it gives the emotional lead for the reading, with ${moon.element.toLowerCase()} tone and ${moon.modality.toLowerCase()} movement.`
      : "start with the strongest visible pattern in the report before making a daily interpretation.",
    leadElement
      ? `the chart's loudest element is ${leadElement[0]} (${leadElement[1]} placements), so the reading should not ignore that repeated temperament.`
      : "",
    leadModality
      ? `the strongest modality is ${leadModality[0]} (${leadModality[1]} placements), which shows how the chart tends to move through pressure.`
      : "",
    leadReport?.body ? `report anchor: ${leadReport.body}` : "",
    "",
    "plain read: use the chart as a map of emphasis, not a sentence of fate. for today, name the strongest pattern, connect it to one practical choice, then keep private journal context separate until you choose to include it."
  ].filter(Boolean).join("\n");
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "missing hypnos request body" }, { status: 400 });

  const question = compact(body.question);
  if (!question) return NextResponse.json({ error: "ask hypnos a question first" }, { status: 400 });

  const tier = compact(body.tier) || "free";
  const limit = planLimit[tier] ?? planLimit.free;
  const placements = Array.isArray(body.placements) ? body.placements as Placement[] : [];
  const elementBalance = Array.isArray(body.elementBalance) ? body.elementBalance as Array<[string, number]> : [];
  const modalityBalance = Array.isArray(body.modalityBalance) ? body.modalityBalance as Array<[string, number]> : [];
  const reportSections = Array.isArray(body.reportSections) ? body.reportSections as ReportSection[] : [];

  const fallback = () => NextResponse.json({
    answer: localAnswer(question, placements, elementBalance, modalityBalance, reportSections),
    limit,
    provider: "local"
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback();

  const profile = body.profile ?? {};
  const reportText = reportSections
    .map((section) => `${section.title}: ${section.body}${section.items?.length ? ` (${section.items.join(", ")})` : ""}`)
    .join("\n")
    .slice(0, 7000);
  const placementText = placements
    .map((placement) => `${placement.body}: ${placement.degree} deg ${placement.minute}' ${placement.sign} / ${placement.element} / ${placement.modality}${placement.retrograde ? " / rx" : ""}`)
    .join("\n")
    .slice(0, 4000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: "you are hypnos ai inside dream logic. answer in lowercase. be clear, grounded, and useful for astrology beginners and experts. do not invent houses, ascendant, or location-sensitive claims unless supplied. explain chart language without sounding mystical or generic."
          },
          {
            role: "user",
            content: [
              `plan: ${tier}. session limit: ${limit}.`,
              `profile: ${compact(profile.name)} / ${compact(profile.birthDate)} / ${compact(profile.birthTime)} / ${compact(profile.locationLabel)} / ${compact(profile.birthTimeCertainty)}.`,
              `placements:\n${placementText}`,
              `report:\n${reportText}`,
              `private journal context:\n${compact(body.journal)}`,
              `question:\n${question}`
            ].join("\n\n")
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) return fallback();

    const outputText = data.output_text
      ?? data.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? []).map((part: { text?: string }) => part.text ?? "").join("\n");

    return NextResponse.json({
      answer: compact(outputText) || localAnswer(question, placements, elementBalance, modalityBalance, reportSections),
      limit,
      provider: "openai"
    });
  } catch {
    return fallback();
  }
}
