import { Suspense } from "react";
import { requireAdminUser } from "@/lib/supabase/server";
import { AdminShell } from "@/components/layout/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminUser();

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <AdminShell admin={admin}>{children}</AdminShell>
    </Suspense>
  );
}
