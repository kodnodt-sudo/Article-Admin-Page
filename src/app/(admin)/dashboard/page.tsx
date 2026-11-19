import Link from "next/link";
import { Building2 } from "lucide-react";
import { getCompaniesDashboardData } from "@/lib/queries";
import { CompanyCard } from "@/components/dashboard/company-card";

interface DashboardPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  const { companies, stats } = await getCompaniesDashboardData();

  const filteredCompanies = query
    ? companies.filter(
        (company) =>
          company.name.toLowerCase().includes(query) ||
          company.domain.toLowerCase().includes(query) ||
          company.slug.toLowerCase().includes(query)
      )
    : companies;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-[#E5E7EB] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-[#111827]">
            Companies
          </h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            Select a company to manage its articles, drafts, and publishing
            settings.
          </p>
        </div>
        {query && (
          <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
            <span>
              Filtered by <strong className="text-[#111827]">&ldquo;{q}&rdquo;</strong>
            </span>
            <Link
              href="/dashboard"
              className="font-medium text-[#1E3A8A] hover:underline"
            >
              Clear
            </Link>
          </div>
        )}
      </div>

      {/* Plain-number Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3.5">
          <p className="text-[12px] font-medium text-[#6B7280]">
            Total articles
          </p>
          <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums text-[#111827]">
            {stats.totalArticles}
          </p>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3.5">
          <p className="text-[12px] font-medium text-[#6B7280]">Drafts</p>
          <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums text-[#111827]">
            {stats.totalDrafts}
          </p>
        </div>
        <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3.5">
          <p className="text-[12px] font-medium text-[#6B7280]">
            Published this month
          </p>
          <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums text-[#111827]">
            {stats.publishedThisMonth}
          </p>
        </div>
      </div>

      {/* Company Cards Grid */}
      {filteredCompanies.length === 0 ? (
        <div className="flex flex-col items-start rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFAFA] p-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#6B7280]">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <h2 className="mt-3 text-[14px] font-semibold text-[#111827]">
            {query ? "No matching companies" : "No companies found"}
          </h2>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            {query
              ? "Try adjusting your search query or clear the filter to view all companies."
              : "Run the Supabase seed SQL to populate the 7 portfolio companies."}
          </p>
          {query && (
            <Link
              href="/dashboard"
              className="mt-4 inline-flex h-8 items-center rounded-md border border-[#E5E7EB] bg-white px-3 text-[13px] font-medium text-[#111827] hover:bg-[#FAFAFA]"
            >
              Reset search
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
