import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/supabase/server";

export default async function HomePage() {
  const result = await getAdminContext();

  if (result.status === "authorized") {
    redirect("/dashboard");
  }
  if (result.status === "forbidden") {
    redirect("/no-access");
  }
  redirect("/login");
}
