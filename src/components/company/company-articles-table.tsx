"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Pencil, Trash2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { ArticleStatus, ArticleWithAuthor } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface CompanyArticlesTableProps {
  companySlug: string;
  initialArticles: ArticleWithAuthor[];
  initialQuery?: string;
}

const PAGE_SIZE = 10;

export function CompanyArticlesTable({
  companySlug,
  initialArticles,
  initialQuery = "",
}: CompanyArticlesTableProps) {
  const router = useRouter();
  const [articles, setArticles] =
    React.useState<ArticleWithAuthor[]>(initialArticles);
  const [search, setSearch] = React.useState(initialQuery);
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | ArticleStatus
  >("all");
  const [page, setPage] = React.useState(1);

  const [deleteTarget, setDeleteTarget] =
    React.useState<ArticleWithAuthor | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setArticles(initialArticles);
  }, [initialArticles]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((article) => {
      if (statusFilter !== "all" && article.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const authorName =
        article.author?.full_name?.toLowerCase() ??
        article.author?.email?.toLowerCase() ??
        "";
      return (
        article.title.toLowerCase().includes(q) ||
        article.slug.toLowerCase().includes(q) ||
        authorName.includes(q)
      );
    });
  }, [articles, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) {
        setDeleteError(error.message);
        setDeleting(false);
        return;
      }

      setArticles((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleting(false);
      router.refresh();
    } catch {
      setDeleteError("Network error while deleting the article.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: search + status filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter articles by title or slug..."
            aria-label="Filter articles"
            className="h-9 sm:h-8 pl-8 text-[16px] sm:text-[13px]"
          />
        </div>

        <div
          className="inline-flex w-full sm:w-auto rounded-md border border-[#E5E7EB] bg-[#FAFAFA] p-0.5"
          role="group"
          aria-label="Filter by status"
        >
          {(["all", "published", "draft"] as const).map((status) => {
            const active = statusFilter === status;
            const label =
              status === "all"
                ? "All"
                : status === "published"
                ? "Published"
                : "Draft";
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={
                  active
                    ? "flex-1 sm:flex-initial rounded px-2.5 py-1.5 sm:py-1 text-[12px] font-medium bg-white text-[#111827] shadow-sm"
                    : "flex-1 sm:flex-initial rounded px-2.5 py-1.5 sm:py-1 text-[12px] font-medium text-[#6B7280] hover:text-[#111827]"
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {deleteError && (
        <div
          role="alert"
          className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[13px] text-[#991B1B]"
        >
          {deleteError}
        </div>
      )}

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-start rounded-lg border border-dashed border-[#E5E7EB] bg-[#FAFAFA] p-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#6B7280]">
            <FileText className="h-4 w-4" aria-hidden="true" />
          </div>
          <h3 className="mt-3 text-[14px] font-semibold text-[#111827]">
            {articles.length === 0
              ? "No articles yet"
              : "No articles match your filters"}
          </h3>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            {articles.length === 0
              ? "Create your first draft or published article for this company."
              : "Try clearing the search input or switching the status filter."}
          </p>
          {articles.length === 0 ? (
            <Link
              href={`/companies/${companySlug}/articles/new`}
              className="mt-4 inline-flex h-8 items-center rounded-md bg-[#1E3A8A] px-3 text-[13px] font-medium text-white hover:bg-[#172554]"
            >
              New article
            </Link>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Reset filters
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
          {/* Mobile card list */}
          <div className="divide-y divide-[#E5E7EB] sm:hidden">
            {paginated.map((article) => {
              const authorLabel =
                article.author?.full_name ||
                article.author?.email ||
                "Editorial team";
              return (
                <div key={article.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/companies/${companySlug}/articles/${article.id}`}
                      className="font-medium text-[14px] leading-snug text-[#111827] hover:text-[#1E3A8A]"
                    >
                      {article.title || "Untitled article"}
                    </Link>
                    <Badge
                      variant={
                        article.status === "published" ? "published" : "draft"
                      }
                      className="shrink-0"
                    >
                      {article.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="truncate text-[12px] text-[#6B7280]">
                    /{article.slug}
                  </p>
                  <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
                    <span className="truncate">{authorLabel}</span>
                    <span className="shrink-0 tabular-nums">
                      {formatDate(article.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/companies/${companySlug}/articles/${article.id}`}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white text-[13px] font-medium text-[#111827] active:bg-[#FAFAFA]"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(article)}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#FECACA] bg-white px-3 text-[13px] font-medium text-[#DC2626] active:bg-[#FEF2F2]"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA] text-[12px] font-medium text-[#6B7280]">
                  <th className="px-4 py-2.5 font-medium">Title</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Author</th>
                  <th className="px-4 py-2.5 font-medium">Last updated</th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {paginated.map((article) => {
                  const authorLabel =
                    article.author?.full_name ||
                    article.author?.email ||
                    "Editorial team";
                  return (
                    <tr
                      key={article.id}
                      className="transition-colors hover:bg-[#FAFAFA]"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/companies/${companySlug}/articles/${article.id}`}
                          className="font-medium text-[#111827] hover:text-[#1E3A8A]"
                        >
                          {article.title || "Untitled article"}
                        </Link>
                        <p className="mt-0.5 text-[12px] text-[#6B7280]">
                          /{article.slug}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            article.status === "published"
                              ? "published"
                              : "draft"
                          }
                        >
                          {article.status === "published"
                            ? "Published"
                            : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[#6B7280]">
                        {authorLabel}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[#6B7280]">
                        {formatDate(article.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/companies/${companySlug}/articles/${article.id}`}
                            aria-label={`Edit ${article.title}`}
                            className="inline-flex h-7 items-center gap-1 rounded px-2 text-[12px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(article)}
                            aria-label={`Delete ${article.title}`}
                            className="inline-flex h-7 items-center gap-1 rounded px-2 text-[12px] font-medium text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#FAFAFA] px-4 py-2.5 text-[12px] text-[#6B7280]">
              <span>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2 tabular-nums text-[#111827]">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete article"
        description={
          deleteTarget
            ? `Are you sure you want to permanently delete "${deleteTarget.title}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete article"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
