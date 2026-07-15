import { cookies } from "next/headers";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

type ContextError = {
  error: string;
  status: number;
};

type WorkspaceContext = {
  supabase: SupabaseClient;
  user: User;
  profileId: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function getWorkspaceContext(): Promise<WorkspaceContext | ContextError> {
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return {
      error: "supabase server keys are missing. add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in vercel.",
      status: 500
    };
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("dl_access_token")?.value;

  if (!accessToken) {
    return { error: "sign in before saving or loading this workspace.", status: 401 };
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false }
  });

  const { data: userData, error: userError } = await authClient.auth.getUser();

  if (userError || !userData.user) {
    return { error: "session expired. sign in again.", status: 401 };
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert({
      auth_user_id: userData.user.id,
      display_name: userData.user.email?.split("@")[0] ?? "dream logic user"
    }, { onConflict: "auth_user_id" })
    .select("id")
    .single();

  if (profileError || !profile) {
    return { error: profileError?.message ?? "could not create profile record.", status: 500 };
  }

  return {
    supabase,
    user: userData.user,
    profileId: profile.id
  };
}

export function isContextError(value: WorkspaceContext | ContextError): value is ContextError {
  return "error" in value;
}
