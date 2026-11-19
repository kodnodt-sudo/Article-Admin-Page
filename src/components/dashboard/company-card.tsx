import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import type { CompanyWithStats } from "@/types/database";

export function CompanyCard({ company }: { company: CompanyWithStats }) {
  return (
    <Link
      href={`/companies/${company.slug}`}
      className="group flex flex-col justify-between rounded-lg border border-[#E5E7EB] bg-white p-5 transition-colors hover:border-[#D1D5DB] hover:bg-[#FAFAFA]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/25 focus-visible:border-[#1E3A8A]"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={`${company.name} logo`}
                className="h-9 w-9 shrink-0 rounded-md border border-[#E5E7EB] bg-white object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#E5E7EB] bg-[#FAFAFA] text-[12px] font-semibold text-[#111827]">
                {getInitials(company.name)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-[14px] font-semibold tracking-tight text-[#111827] group-hover:text-[#1E3A8A]">
                {company.name}
              </h2>
              <p className="truncate text-[12px] text-[#6B7280]">
                {company.domain}
              </p>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[12px] font-medium text-[#6B7280] transition-colors group-hover:text-[#1E3A8A]">
            Open
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[#E5E7EB] pt-4">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
              Published
            </dt>
            <dd className="mt-0.5 text-[16px] font-semibold tabular-nums text-[#111827]">
              {company.published_count}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
              Drafts
            </dt>
            <dd className="mt-0.5 text-[16px] font-semibold tabular-nums text-[#111827]">
              {company.draft_count}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#F3F4F6] pt-3 text-[12px] text-[#6B7280]">
        <span>Last updated</span>
        <span className="tabular-nums text-[#111827]">
          {formatDate(company.last_updated_at)}
        </span>
      </div>
    </Link>
  );
}
