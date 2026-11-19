import { createClient } from "@/lib/supabase/server";
import type { Company, CompanyWithStats } from "@/types/database";

export interface DashboardStats {
  totalArticles: number;
  totalDrafts: number;
  publishedThisMonth: number;
}

export async function getCompaniesDashboardData(): Promise<{
  companies: CompanyWithStats[];
  stats: DashboardStats;
}> {
  const supabase = await createClient();

  const [{ data: companiesData, error: companiesError }, { data: articlesData, error: articlesError }] =
    await Promise.all([
      supabase
        .from("companies")
        .select("id, name, slug, domain, logo_url, created_at")
        .order("name", { ascending: true }),
      supabase
        .from("articles")
        .select("id, company_id, status, published_at, updated_at"),
    ]);

  if (companiesError) {
    throw new Error(`Failed to load companies: ${companiesError.message}`);
  }
  if (articlesError) {
    throw new Error(`Failed to load articles: ${articlesError.message}`);
  }

  const companies = (companiesData ?? []) as Company[];
  const articles = articlesData ?? [];

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  let totalDrafts = 0;
  let publishedThisMonth = 0;

  const statsByCompany = new Map<
    string,
    { published: number; draft: number; lastUpdated: string | null }
  >();

  for (const article of articles) {
    const entry = statsByCompany.get(article.company_id) ?? {
      published: 0,
      draft: 0,
      lastUpdated: null,
    };

    if (article.status === "published") {
      entry.published += 1;
      if (article.published_at && new Date(article.published_at) >= monthStart) {
        publishedThisMonth += 1;
      }
    } else {
      entry.draft += 1;
      totalDrafts += 1;
    }

    if (
      article.updated_at &&
      (!entry.lastUpdated ||
        new Date(article.updated_at) > new Date(entry.lastUpdated))
    ) {
      entry.lastUpdated = article.updated_at;
    }

    statsByCompany.set(article.company_id, entry);
  }

  const enriched: CompanyWithStats[] = companies.map((company) => {
    const entry = statsByCompany.get(company.id);
    return {
      ...company,
      published_count: entry?.published ?? 0,
      draft_count: entry?.draft ?? 0,
      last_updated_at: entry?.lastUpdated ?? company.created_at,
    };
  });

  return {
    companies: enriched,
    stats: {
      totalArticles: articles.length,
      totalDrafts,
      publishedThisMonth,
    },
  };
}
