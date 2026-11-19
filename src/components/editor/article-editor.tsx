"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Loader2,
  Trash2,
  Upload,
  X,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { Article, ArticleStatus, Company } from "@/types/database";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ArticleEditorProps {
  company: Company;
  authorId: string;
  initialArticle: Article | null;
}

const EMPTY_DOC: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function ArticleEditor({
  company,
  authorId,
  initialArticle,
}: ArticleEditorProps) {
  const router = useRouter();

  const [articleId, setArticleId] = React.useState<string | null>(
    initialArticle?.id ?? null
  );
  const [status, setStatus] = React.useState<ArticleStatus>(
    initialArticle?.status ?? "draft"
  );
  const [publishedAt, setPublishedAt] = React.useState<string | null>(
    initialArticle?.published_at ?? null
  );

  const [title, setTitle] = React.useState(initialArticle?.title ?? "");
  const [slug, setSlug] = React.useState(initialArticle?.slug ?? "");
  const [slugEditedManually, setSlugEditedManually] = React.useState(
    Boolean(initialArticle?.slug)
  );
  const [content, setContent] = React.useState<Record<string, unknown>>(
    initialArticle?.content ?? EMPTY_DOC
  );
  const [excerpt, setExcerpt] = React.useState(initialArticle?.excerpt ?? "");
  const [featuredImage, setFeaturedImage] = React.useState(
    initialArticle?.featured_image ?? ""
  );
  const [metaTitle, setMetaTitle] = React.useState(
    initialArticle?.meta_title ?? ""
  );
  const [metaDescription, setMetaDescription] = React.useState(
    initialArticle?.meta_description ?? ""
  );

  const [saveState, setSaveState] = React.useState<SaveState>(
    initialArticle ? "saved" : "idle"
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = React.useState(false);

  const [confirmUnpublishOpen, setConfirmUnpublishOpen] = React.useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const isInitialMount = React.useRef(true);
  const saveInFlightRef = React.useRef(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugEditedManually) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugEditedManually(true);
    setSlug(slugify(value));
  }

  const persistArticle = React.useCallback(
    async (nextStatus?: ArticleStatus): Promise<boolean> => {
      if (saveInFlightRef.current) return false;

      const resolvedTitle = title.trim();
      if (!resolvedTitle) {
        setErrorMessage("Add an article title before saving.");
        setSaveState("error");
        return false;
      }

      const resolvedSlug = slug.trim() || slugify(resolvedTitle);
      if (!resolvedSlug) {
        setErrorMessage("A valid URL slug is required.");
        setSaveState("error");
        return false;
      }

      saveInFlightRef.current = true;
      setSaveState("saving");
      setErrorMessage(null);

      const targetStatus = nextStatus ?? status;
      const nextPublishedAt =
        targetStatus === "published"
          ? publishedAt ?? new Date().toISOString()
          : publishedAt;

      const payload = {
        company_id: company.id,
        title: resolvedTitle,
        slug: resolvedSlug,
        content,
        excerpt: excerpt.trim() || null,
        featured_image: featuredImage.trim() || null,
        status: targetStatus,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        author_id: authorId,
        published_at: nextPublishedAt,
      };

      try {
        const supabase = createClient();

        if (!articleId) {
          const { data, error } = await supabase
            .from("articles")
            .insert(payload)
            .select("id, status, published_at, slug")
            .single();

          if (error) {
            setErrorMessage(
              error.code === "23505"
                ? "An article with this slug already exists for this company."
                : error.message
            );
            setSaveState("error");
            saveInFlightRef.current = false;
            return false;
          }

          setArticleId(data.id);
          setStatus(data.status as ArticleStatus);
          setPublishedAt(data.published_at);
          setSlug(data.slug);
          window.history.replaceState(
            null,
            "",
            `/companies/${company.slug}/articles/${data.id}`
          );
        } else {
          const { data, error } = await supabase
            .from("articles")
            .update(payload)
            .eq("id", articleId)
            .select("id, status, published_at, slug")
            .single();

          if (error) {
            setErrorMessage(
              error.code === "23505"
                ? "An article with this slug already exists for this company."
                : error.message
            );
            setSaveState("error");
            saveInFlightRef.current = false;
            return false;
          }

          setStatus(data.status as ArticleStatus);
          setPublishedAt(data.published_at);
          setSlug(data.slug);
        }

        setSaveState("saved");
        saveInFlightRef.current = false;
        return true;
      } catch {
        setErrorMessage("Network error while saving.");
        setSaveState("error");
        saveInFlightRef.current = false;
        return false;
      }
    },
    [
      articleId,
      authorId,
      company.id,
      company.slug,
      content,
      excerpt,
      featuredImage,
      metaDescription,
      metaTitle,
      publishedAt,
      slug,
      status,
      title,
    ]
  );

  // Debounced autosave
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!title.trim()) return;

    const timer = window.setTimeout(() => {
      void persistArticle();
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [
    title,
    slug,
    content,
    excerpt,
    featuredImage,
    metaTitle,
    metaDescription,
    persistArticle,
  ]);

  async function handleFeaturedImageUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const filePath = `${company.id}/featured/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        setErrorMessage(`Image upload failed: ${uploadError.message}`);
        setUploadingCover(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("article-images")
        .getPublicUrl(filePath);

      setFeaturedImage(urlData.publicUrl);
    } catch {
      setErrorMessage("Network error while uploading featured image.");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function handleDeleteArticle() {
    if (!articleId) return;
    setDeleting(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", articleId);

      if (error) {
        setErrorMessage(error.message);
        setDeleting(false);
        return;
      }

      router.replace(`/companies/${company.slug}`);
      router.refresh();
    } catch {
      setErrorMessage("Network error while deleting the article.");
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-white">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-2 px-3.5 py-2 sm:flex-nowrap sm:gap-4 sm:px-6 sm:py-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href={`/companies/${company.slug}`}
              className="inline-flex h-9 sm:h-8 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-2.5 text-[13px] font-medium text-[#111827] hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/25"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#6B7280]" aria-hidden="true" />
              Back
            </Link>
            <span className="hidden truncate text-[13px] text-[#6B7280] sm:inline">
              {company.name}
            </span>
            <Badge variant={status === "published" ? "published" : "draft"}>
              {status === "published" ? "Published" : "Draft"}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Save indicator */}
            <div
              className="flex items-center gap-1 pr-1 sm:pr-2 text-[12px] text-[#6B7280]"
              aria-live="polite"
            >
              {saveState === "saving" && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span className="hidden sm:inline">Saving…</span>
                </>
              )}
              {saveState === "saved" && (
                <>
                  <Check className="h-3.5 w-3.5 text-[#166534]" aria-hidden="true" />
                  <span className="hidden sm:inline">Saved</span>
                </>
              )}
              {saveState === "error" && (
                <span className="text-[#DC2626]">Failed</span>
              )}
            </div>

            {status === "published" ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmUnpublishOpen(true)}
                disabled={saveState === "saving"}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void persistArticle("draft")}
                disabled={saveState === "saving"}
              >
                Save draft
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={() => void persistArticle("published")}
              disabled={saveState === "saving"}
            >
              {status === "published" ? "Update" : "Publish"}
            </Button>

            {articleId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDeleteOpen(true)}
                aria-label="Delete article"
                className="text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-2 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-[13px] text-[#991B1B]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Writing Column */}
          <div className="space-y-5">
            <div>
              <label htmlFor="article-title" className="sr-only">
                Article title
              </label>
              <input
                id="article-title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Article title"
                className="w-full border-0 bg-transparent px-0 py-1 text-[22px] sm:text-[28px] font-semibold leading-tight tracking-tight text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
              />
            </div>

            <TiptapEditor
              content={content}
              companyId={company.id}
              onChange={setContent}
            />
          </div>

          {/* Metadata Sidebar */}
          <aside className="space-y-5">
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-4 space-y-4">
              <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Article Details
              </h2>

              {/* Slug */}
              <div className="space-y-1.5">
                <label
                  htmlFor="article-slug"
                  className="block text-[12px] font-medium text-[#111827]"
                >
                  Slug
                </label>
                <Input
                  id="article-slug"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="article-url-slug"
                  className="h-8 bg-white text-[13px]"
                />
              </div>

              {/* Featured Image */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-[#111827]">
                  Featured image
                </label>
                {featuredImage ? (
                  <div className="relative overflow-hidden rounded-md border border-[#E5E7EB] bg-white">
                    <img
                      src={featuredImage}
                      alt="Featured"
                      className="h-36 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFeaturedImage("")}
                      aria-label="Remove featured image"
                      className="absolute right-2 top-2 rounded border border-[#E5E7EB] bg-white p-1 text-[#6B7280] shadow-sm hover:text-[#111827]"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-[#D1D5DB] bg-white p-3 text-center">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFeaturedImageUpload}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={uploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      Upload cover image
                    </Button>
                  </div>
                )}
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <label
                  htmlFor="article-excerpt"
                  className="block text-[12px] font-medium text-[#111827]"
                >
                  Excerpt
                </label>
                <textarea
                  id="article-excerpt"
                  rows={3}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Short summary for article listings..."
                  className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-[16px] sm:text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/15"
                />
              </div>
            </div>

            {/* SEO Metadata */}
            <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-4 space-y-4">
              <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">
                Search Metadata
              </h2>

              <div className="space-y-1.5">
                <label
                  htmlFor="meta-title"
                  className="block text-[12px] font-medium text-[#111827]"
                >
                  Meta title
                </label>
                <Input
                  id="meta-title"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Optional SEO title"
                  className="h-8 bg-white text-[13px]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="meta-description"
                  className="block text-[12px] font-medium text-[#111827]"
                >
                  Meta description
                </label>
                <textarea
                  id="meta-description"
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Optional search engine description..."
                  className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-[16px] sm:text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/15"
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Confirm Unpublish */}
      <ConfirmDialog
        open={confirmUnpublishOpen}
        title="Unpublish article"
        description="This article will revert to draft status and will no longer be marked as published."
        confirmLabel="Unpublish"
        variant="primary"
        loading={saveState === "saving"}
        onConfirm={async () => {
          const ok = await persistArticle("draft");
          if (ok) setConfirmUnpublishOpen(false);
        }}
        onCancel={() => setConfirmUnpublishOpen(false)}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete article"
        description={`Are you sure you want to permanently delete "${title || "this article"}"? This action cannot be undone.`}
        confirmLabel="Delete article"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteArticle}
        onCancel={() => {
          if (!deleting) setConfirmDeleteOpen(false);
        }}
      />
    </div>
  );
}
