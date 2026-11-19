import { notFound } from "next/navigation";
import { createClient, requireAdminUser } from "@/lib/supabase/server";
import type { Article, Company } from "@/types/database";
import { ArticleEditor } from "@/components/editor/article-editor";

interface EditArticlePageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function EditArticlePage({
  params,
}: EditArticlePageProps) {
  const { slug, id } = await params;
  const admin = await requireAdminUser();
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

  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select(
      "id, company_id, title, slug, content, excerpt, featured_image, status, meta_title, meta_description, author_id, published_at, created_at, updated_at"
    )
    .eq("id", id)
    .eq("company_id", company.id)
    .maybeSingle<Article>();

  if (articleError) {
    throw new Error(`Failed to load article: ${articleError.message}`);
  }
  if (!article) {
    notFound();
  }

  return (
    <ArticleEditor
      company={company}
      authorId={admin.userId}
      initialArticle={article}
    />
  );
}
