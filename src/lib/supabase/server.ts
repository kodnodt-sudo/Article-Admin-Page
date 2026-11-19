import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: CookieOptions;
        }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component; middleware handles cookie refresh.
        }
      },
    },
  });
}

export interface AdminContext {
  userId: string;
  email: string;
  fullName: string | null;
}

export async function getAdminContext(): Promise<{
  status: "unauthenticated" | "forbidden" | "authorized";
  admin: AdminContext | null;
}> {
  if (!isSupabaseConfigured()) {
    return { status: "unauthenticated", admin: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { status: "unauthenticated", admin: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("id", user.id)
    .maybeSingle<Pick<Profile, "id" | "email" | "full_name">>();

  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null;

  return {
    status: "authorized",
    admin: {
      userId: user.id,
      email: user.email ?? profile?.email ?? "",
      fullName: profile?.full_name ?? metadataName,
    },
  };
}

export async function requireAdminUser(): Promise<AdminContext> {
  const result = await getAdminContext();
  if (result.status === "unauthenticated") {
    redirect("/login");
  }
  if (result.status === "forbidden" || !result.admin) {
    redirect("/no-access");
  }
  return result.admin;
}
