"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Company } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CompanySettingsForm({ company }: { company: Company }) {
  const router = useRouter();
  const [name, setName] = React.useState(company.name);
  const [domain, setDomain] = React.useState(company.domain);
  const [logoUrl, setLogoUrl] = React.useState(company.logo_url ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (!name.trim() || !domain.trim()) {
      setError("Company name and domain are required.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("companies")
        .update({
          name: name.trim(),
          domain: domain.trim(),
          logo_url: logoUrl.trim() || null,
        })
        .eq("id", company.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setSaving(false);
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error while saving company settings.");
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl rounded-lg border border-[#E5E7EB] bg-white"
    >
      <div className="border-b border-[#E5E7EB] px-5 py-4">
        <h2 className="text-[14px] font-semibold text-[#111827]">
          Company profile
        </h2>
        <p className="mt-0.5 text-[12px] text-[#6B7280]">
          Update display name, primary domain, or logo URL for {company.name}.
        </p>
      </div>

      <div className="space-y-4 p-5">
        {error && (
          <div
            role="alert"
            className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[13px] text-[#991B1B]"
          >
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="company-name"
            className="block text-[13px] font-medium text-[#111827]"
          >
            Company name
          </label>
          <Input
            id="company-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="company-slug"
            className="block text-[13px] font-medium text-[#111827]"
          >
            Slug
          </label>
          <Input id="company-slug" value={company.slug} disabled />
          <p className="text-[12px] text-[#6B7280]">
            URL identifier used in admin routes.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="company-domain"
            className="block text-[13px] font-medium text-[#111827]"
          >
            Domain
          </label>
          <Input
            id="company-domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            disabled={saving}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="company-logo"
            className="block text-[13px] font-medium text-[#111827]"
          >
            Logo URL
          </label>
          <Input
            id="company-logo"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
            disabled={saving}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#FAFAFA] px-5 py-3">
        <div className="text-[12px] text-[#166534]">
          {saved && (
            <span className="inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Changes saved
            </span>
          )}
        </div>
        <Button type="submit" variant="primary" size="sm" loading={saving}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
