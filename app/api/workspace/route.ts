import { NextRequest, NextResponse } from "next/server";
import { isContextError, getWorkspaceContext } from "../_lib/dreamlogic";

type PlacementPayload = {
  body: string;
  sign: string;
  degree: number;
  minute: number;
  longitude?: number;
  element: string;
  modality: string;
  retrograde: boolean;
};

type WorkspacePayload = {
  profile?: {
    name?: string;
    birthDate?: string;
    birthTime?: string;
    birthTimeCertainty?: string;
    locationLabel?: string;
  };
  placements?: PlacementPayload[];
  elementBalance?: Array<[string, number]>;
  modalityBalance?: Array<[string, number]>;
  journal?: string;
  clients?: string[];
  tier?: string;
  mode?: string;
  reportSections?: Array<{ title: string; body: string; items?: string[] }>;
};

export async function GET() {
  const context = await getWorkspaceContext();
  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { data, error } = await context.supabase
    .from("workspace_states")
    .select("state, updated_at")
    .eq("owner_profile_id", context.profileId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({
      error: error.message.includes("workspace_states")
        ? "run the workspace_states migration in supabase before loading saved work."
        : error.message
    }, { status: 500 });
  }

  return NextResponse.json({
    state: data?.state ?? null,
    updatedAt: data?.updated_at ?? null
  });
}

export async function POST(request: NextRequest) {
  const context = await getWorkspaceContext();
  if (isContextError(context)) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const payload = await request.json() as WorkspacePayload;
  const profile = payload.profile;

  if (!profile?.name || !profile.birthDate || !profile.birthTime || !profile.locationLabel) {
    return NextResponse.json({ error: "profile name, date, time, and place are required." }, { status: 400 });
  }

  const birthProfileId = await saveBirthProfile(context, payload);
  if ("error" in birthProfileId) return NextResponse.json({ error: birthProfileId.error }, { status: birthProfileId.status });

  const snapshotId = await saveChartSnapshot(context, birthProfileId.id, payload);
  if ("error" in snapshotId) return NextResponse.json({ error: snapshotId.error }, { status: snapshotId.status });

  const journalResult = await saveJournal(context, birthProfileId.id, payload);
  if ("error" in journalResult) return NextResponse.json({ error: journalResult.error }, { status: journalResult.status });

  const reportResult = await saveReport(context, birthProfileId.id, payload);
  if ("error" in reportResult) return NextResponse.json({ error: reportResult.error }, { status: reportResult.status });

  const updatedAt = new Date().toISOString();
  const { error: stateError } = await context.supabase
    .from("workspace_states")
    .upsert({
      owner_profile_id: context.profileId,
      state: {
        ...payload,
        birthProfileId: birthProfileId.id,
        chartSnapshotId: snapshotId.id,
        reportId: reportResult.id,
        updatedAt
      },
      updated_at: updatedAt
    }, { onConflict: "owner_profile_id" });

  if (stateError) {
    return NextResponse.json({
      error: stateError.message.includes("workspace_states")
        ? "run the workspace_states migration in supabase before saving work."
        : stateError.message
    }, { status: 500 });
  }

  await context.supabase.from("audit_logs").insert({
    actor_profile_id: context.profileId,
    action: "workspace.saved",
    target_table: "birth_profiles",
    target_id: birthProfileId.id,
    metadata: { tier: payload.tier, placement_count: payload.placements?.length ?? 0 }
  });

  return NextResponse.json({
    message: "workspace saved to supabase.",
    birthProfileId: birthProfileId.id,
    chartSnapshotId: snapshotId.id,
    reportId: reportResult.id,
    updatedAt
  });
}

async function saveBirthProfile(context: Awaited<ReturnType<typeof getWorkspaceContext>> & { error?: never }, payload: WorkspacePayload) {
  const profile = payload.profile!;
  const existing = await context.supabase
    .from("birth_profiles")
    .select("id")
    .eq("owner_profile_id", context.profileId)
    .eq("name", profile.name)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const record = {
    owner_profile_id: context.profileId,
    name: profile.name,
    birth_date: profile.birthDate,
    birth_time: profile.birthTimeCertainty === "unknown" ? null : profile.birthTime,
    birth_time_certainty: profile.birthTimeCertainty ?? "unknown",
    location_label: profile.locationLabel,
    dst_status: "unknown",
    ambiguity_status: profile.birthTimeCertainty === "unknown" ? "unknown_time" : "exact",
    house_system: "placidus",
    zodiac_mode: "tropical",
    updated_at: new Date().toISOString()
  };

  if (existing.error) return { error: existing.error.message, status: 500 };

  const result = existing.data
    ? await context.supabase.from("birth_profiles").update(record).eq("id", existing.data.id).select("id").single()
    : await context.supabase.from("birth_profiles").insert(record).select("id").single();

  if (result.error || !result.data) return { error: result.error?.message ?? "could not save birth profile.", status: 500 };
  return { id: result.data.id as string };
}

async function saveChartSnapshot(context: Awaited<ReturnType<typeof getWorkspaceContext>> & { error?: never }, birthProfileId: string, payload: WorkspacePayload) {
  const { data: snapshot, error: snapshotError } = await context.supabase
    .from("chart_snapshots")
    .insert({
      birth_profile_id: birthProfileId,
      provider: "astronomy-engine",
      provider_version: "runtime",
      resolver_version: "dreamlogic-webapp",
      settings: {
        zodiac_mode: "tropical",
        house_system: "placidus",
        time_certainty: payload.profile?.birthTimeCertainty,
        note: payload.profile?.birthTimeCertainty === "unknown" ? "calculated from noon until confirmed birth time is available." : "calculated from supplied birth time."
      },
      warnings: payload.profile?.birthTimeCertainty === "unknown" ? ["unknown birth time"] : []
    })
    .select("id")
    .single();

  if (snapshotError || !snapshot) return { error: snapshotError?.message ?? "could not save chart snapshot.", status: 500 };

  if (payload.placements?.length) {
    const points = payload.placements.map((placement) => ({
      chart_snapshot_id: snapshot.id,
      body: placement.body,
      sign: placement.sign,
      degree: placement.degree,
      minute: placement.minute,
      longitude_decimal: placement.longitude ?? placement.degree + placement.minute / 60,
      house: null,
      retrograde: placement.retrograde,
      is_retrograde: placement.retrograde,
      raw: placement
    }));

    const { error: pointError } = await context.supabase.from("chart_points").insert(points);
    if (pointError) return { error: pointError.message, status: 500 };
  }

  return { id: snapshot.id as string };
}

async function saveJournal(context: Awaited<ReturnType<typeof getWorkspaceContext>> & { error?: never }, birthProfileId: string, payload: WorkspacePayload) {
  if (!payload.journal?.trim()) return { id: null };

  const existing = await context.supabase
    .from("journal_entries")
    .select("id")
    .eq("owner_profile_id", context.profileId)
    .eq("birth_profile_id", birthProfileId)
    .eq("entry_type", "reflection")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error) return { error: existing.error.message, status: 500 };

  const record = {
    owner_profile_id: context.profileId,
    birth_profile_id: birthProfileId,
    entry_type: "reflection",
    title: `${payload.profile?.name ?? "chart"} notes`,
    body: payload.journal,
    linked_context: { source: "workspace", clients: payload.clients ?? [] },
    updated_at: new Date().toISOString()
  };

  const result = existing.data
    ? await context.supabase.from("journal_entries").update(record).eq("id", existing.data.id).select("id").single()
    : await context.supabase.from("journal_entries").insert(record).select("id").single();

  if (result.error) return { error: result.error.message, status: 500 };
  return { id: result.data?.id ?? null };
}

async function saveReport(context: Awaited<ReturnType<typeof getWorkspaceContext>> & { error?: never }, birthProfileId: string, payload: WorkspacePayload) {
  const title = `${payload.profile?.name ?? "chart"} report`;
  const body = (payload.reportSections ?? [])
    .map((section) => [section.title, section.body, ...(section.items ?? [])].join("\n"))
    .join("\n\n");

  const record = {
    owner_profile_id: context.profileId,
    report_type: "natal",
    status: "draft",
    title,
    body,
    source_context: {
      birth_profile_id: birthProfileId,
      profile: payload.profile,
      element_balance: payload.elementBalance,
      modality_balance: payload.modalityBalance,
      tier: payload.tier,
      mode: payload.mode
    },
    updated_at: new Date().toISOString()
  };

  const existing = await context.supabase
    .from("reports")
    .select("id")
    .eq("owner_profile_id", context.profileId)
    .eq("report_type", "natal")
    .eq("title", title)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing.error) return { error: existing.error.message, status: 500 };

  const { data, error } = existing.data
    ? await context.supabase.from("reports").update(record).eq("id", existing.data.id).select("id").single()
    : await context.supabase.from("reports").insert(record).select("id").single();

  if (error || !data) return { error: error?.message ?? "could not save report.", status: 500 };
  return { id: data.id as string };
}
