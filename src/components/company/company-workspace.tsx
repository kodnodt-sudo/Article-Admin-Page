"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import type { ArticleWithAuthor, Company } from "@/types/database";
import { CompanyArticlesTable } from "@/components/company/company-articles-table";
import { CompanySettingsForm } from "@/components/company/company-settings-form";

interface CompanyWorkspaceProps {
  company: Company;
  articles: ArticleWithAuthor[];
  initialQuery?: string;
}

export function CompanyWorkspace({
  company,
  articles,
  initialQuery,
}: CompanyWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState<"articles" | "settings">(
    "articles"
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px]">
        <Link
          href="/dashboard"
          className="text-[#6B7280] hover:text-[#111827] hover:underline"
        >
          Dashboard
        </Link>
        <ChevronRight
          className="h-3.5 w-3.5 text-[#9CA3AF]"
          aria-hidden="true"
        />
        <span className="font-medium text-[#111827]">{company.name}</span>
      </nav>

      {/* Company header + Primary action */}
      <div className="flex flex-col gap-4 border-b border-[#E5E7EB] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={`${company.name} logo`}
              className="h-10 w-10 rounded-md border border-[#E5E7EB] object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#E5E7EB] bg-[#FAFAFA] text-[13px] font-semibold text-[#111827]">
              {getInitials(company.name)}
            </div>
          )}
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-[#111827]">
              {company.name}
            </h1>
            <p className="text-[13px] text-[#6B7280]">{company.domain}</p>
          </div>
        </div>

        <Link
          href={`/companies/${company.slug}/articles/new`}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#1E3A8A] bg-[#1E3A8A] px-3.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#172554] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/25"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New article
        </Link>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="border-b border-[#E5E7EB]">
        <div className="-mb-px flex gap-6" role="tablist" aria-label="Company sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "articles"}
            onClick={() => setActiveTab("articles")}
            className={cn(
              "border-b-2 pb-2.5 text-[13px] font-medium transition-colors",
              activeTab === "articles"
                ? "border-[#1E3A8A] text-[#1E3A8A]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            )}
          >
            Articles ({articles.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            className={cn(
              "border-b-2 pb-2.5 text-[13px] font-medium transition-colors",
              activeTab === "settings"
                ? "border-[#1E3A8A] text-[#1E3A8A]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]"
            )}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Tab Panel */}
      {activeTab === "articles" ? (
        <CompanyArticlesTable
          companySlug={company.slug}
          initialArticles={articles}
          initialQuery={initialQuery}
        />
      ) : (
        <CompanySettingsForm company={company} />
      )}
    </div>
  );
}
