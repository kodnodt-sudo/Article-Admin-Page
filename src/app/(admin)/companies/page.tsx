import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getCompaniesDashboardData } from "@/lib/queries";
import { formatDate, getInitials } from "@/lib/utils";

export default async function CompaniesIndexPage() {
  const { companies } = await getCompaniesDashboardData();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="border-b border-[#E5E7EB] pb-4">
        <h1 className="text-[20px] font-semibold tracking-tight text-[#111827]">
          Companies directory
        </h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          Overview of all publishing entities and their editorial inventory.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA] text-[12px] font-medium text-[#6B7280]">
                <th className="px-4 py-2.5 font-medium">Company</th>
                <th className="px-4 py-2.5 font-medium">Domain</th>
                <th className="px-4 py-2.5 text-right font-medium">Published</th>
                <th className="px-4 py-2.5 text-right font-medium">Drafts</th>
                <th className="px-4 py-2.5 font-medium">Last updated</th>
                <th className="px-4 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {companies.map((company) => (
                <tr
                  key={company.id}
                  className="transition-colors hover:bg-[#FAFAFA]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/companies/${company.slug}`}
                      className="flex items-center gap-2.5 font-medium text-[#111827] hover:text-[#1E3A8A]"
                    >
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={`${company.name} logo`}
                          className="h-6 w-6 rounded border border-[#E5E7EB] object-cover"
                        />
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded border border-[#E5E7EB] bg-[#FAFAFA] text-[10px] font-semibold text-[#111827]">
                          {getInitials(company.name)}
                        </span>
                      )}
                      <span>{company.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280]">{company.domain}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#111827]">
                    {company.published_count}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#111827]">
                    {company.draft_count}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-[#6B7280]">
                    {formatDate(company.last_updated_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/companies/${company.slug}`}
                      className="inline-flex items-center gap-1 font-medium text-[#1E3A8A] hover:underline"
                    >
                      Open
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
