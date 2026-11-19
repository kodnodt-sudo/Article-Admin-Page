import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ArticleWithAuthor, Company } from "@/types/database";
import { CompanyWorkspace } from "@/components/company/company-workspace";

interface CompanyPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function CompanyPage({
  params,
  searchParams,
}: CompanyPageProps) {
  const { slug } = await params;
  const { q } = await searchParams;

  const supabase = await createClient();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, slug, domain, logo_url, created_at")
    .eq("slug", slug)
    .maybeSingle<Company>();

  if (companyError) {
    throw new Error(`Failed to load company: ${companyError.message}`);
  }
  if (!company) {
    notFound();
  }

  const { data: articlesData, error: articlesError } = await supabase
    .from("articles")
    .select(
      `
      id,
      company_id,
      title,
      slug,
      content,
      excerpt,
      featured_image,
      status,
      meta_title,
      meta_description,
      author_id,
      published_at,
      created_at,
      updated_at,
      author:profiles(id, email, full_name)
    `
    )
    .eq("company_id", company.id)
    .order("updated_at", { ascending: false });

  if (articlesError) {
    throw new Error(`Failed to load articles: ${articlesError.message}`);
  }

  const articles = (articlesData ?? []).map((row) => {
    const authorRelation = Array.isArray(row.author)
      ? row.author[0] ?? null
      : row.author ?? null;
    return {
      ...row,
      author: authorRelation,
    };
  }) as ArticleWithAuthor[];

  return (
    <CompanyWorkspace
      company={company}
      articles={articles}
      initialQuery={q ?? ""}
    />
  );
}
