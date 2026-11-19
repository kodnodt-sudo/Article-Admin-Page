import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getAdminContext } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function NoAccessPage() {
  const auth = await getAdminContext();

  if (auth.status === "unauthenticated") {
    redirect("/login");
  }
  if (auth.status === "authorized") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-4">
      <div className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] bg-[#FAFAFA] text-[#111827]">
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-[18px] font-semibold tracking-tight text-[#111827]">
          No access
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#6B7280]">
          Your account is signed in, but it does not have the{" "}
          <code className="rounded bg-[#F3F4F6] px-1 py-0.5 text-[12px] text-[#111827]">
            admin
          </code>{" "}
          role required to access this workspace. Contact your system
          administrator to request access.
        </p>
        <div className="mt-5 flex items-center justify-end border-t border-[#E5E7EB] pt-4">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
