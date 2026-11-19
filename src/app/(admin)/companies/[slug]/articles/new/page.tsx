import { notFound } from "next/navigation";
import { createClient, requireAdminUser } from "@/lib/supabase/server";
import type { Company } from "@/types/database";
import { ArticleEditor } from "@/components/editor/article-editor";

interface NewArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewArticlePage({ params }: NewArticlePageProps) {
  const { slug } = await params;
  const admin = await requireAdminUser();
  const supabase = await createClient();

  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name, slug, domain, logo_url, created_at")
    .eq("slug", slug)
    .maybeSingle<Company>();

  if (error) {
    throw new Error(`Failed to load company: ${error.message}`);
  }
  if (!company) {
    notFound();
  }

  return (
    <ArticleEditor
      company={company}
      authorId={admin.userId}
      initialArticle={null}
    />
  );
}
