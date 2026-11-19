import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAdminContext } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const configured = isSupabaseConfigured();
  const auth = await getAdminContext();
  if (auth.status === "authorized") {
    redirect("/dashboard");
  }
  if (auth.status === "forbidden") {
    redirect("/no-access");
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left panel: simple form on white */}
      <div className="flex flex-col justify-between bg-white px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center">
          <img
            src="/kodnod-logo.png"
            alt="KODNOD Digital Systems"
            className="h-9 w-auto rounded-md"
          />
        </div>

        <div className="mx-auto w-full max-w-[360px] py-12">
          <div className="mb-6">
            <h1 className="text-[20px] font-semibold tracking-tight text-[#111827]">
              Sign in
            </h1>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              Enter your administrator credentials to continue.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="h-48 animate-pulse rounded-md bg-[#FAFAFA]" />
            }
          >
            <LoginForm isConfigured={configured} />
          </Suspense>

          <p className="mt-6 text-[12px] text-[#6B7280]">
            Access is restricted to provisioned administrator accounts.
          </p>
        </div>

        <div className="text-[12px] text-[#9CA3AF]">
          Multi-company publishing console
        </div>
      </div>

      {/* Right panel: quiet light-gray panel */}
      <div className="hidden border-l border-[#E5E7EB] bg-[#FAFAFA] lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="max-w-md">
          <p className="text-[12px] font-medium uppercase tracking-wider text-[#6B7280]">
            Editorial Operations
          </p>
          <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-[#111827]">
            KODNOD Admin
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
            Manage articles, drafts, and publishing metadata across all seven
            portfolio companies from one workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
