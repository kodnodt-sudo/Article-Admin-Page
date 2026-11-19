import { requireAdminUser } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function SettingsPage() {
  const admin = await requireAdminUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="border-b border-[#E5E7EB] pb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-[#111827]">
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          Administrator session and workspace access configuration.
        </p>
      </div>

      <section className="rounded-lg border border-[#E5E7EB] bg-white">
        <div className="border-b border-[#E5E7EB] px-5 py-4">
          <h2 className="text-[14px] font-semibold text-[#111827]">
            Administrator account
          </h2>
          <p className="mt-0.5 text-[12px] text-[#6B7280]">
            Accounts are provisioned and managed in Supabase Authentication.
          </p>
        </div>

        <dl className="divide-y divide-[#E5E7EB] px-5 text-[13px]">
          <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-[#6B7280]">Email address</dt>
            <dd className="font-medium text-[#111827]">{admin.email}</dd>
          </div>
          <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-[#6B7280]">Display name</dt>
            <dd className="font-medium text-[#111827]">
              {admin.fullName || "—"}
            </dd>
          </div>
          <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-[#6B7280]">Role</dt>
            <dd>
              <Badge variant="published">admin</Badge>
            </dd>
          </div>
          <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-[#6B7280]">User ID</dt>
            <dd className="font-mono text-[12px] text-[#6B7280]">
              {admin.userId}
            </dd>
          </div>
        </dl>

        <div className="flex items-center justify-end border-t border-[#E5E7EB] bg-[#FAFAFA] px-5 py-3">
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
