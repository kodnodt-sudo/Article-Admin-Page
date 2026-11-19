export type UserRole = "admin" | "user";

export type ArticleStatus = "draft" | "published";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo_url: string | null;
  created_at: string;
}

export interface CompanyWithStats extends Company {
  published_count: number;
  draft_count: number;
  last_updated_at: string | null;
}

export interface Article {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  excerpt: string | null;
  featured_image: string | null;
  status: ArticleStatus;
  meta_title: string | null;
  meta_description: string | null;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleWithAuthor extends Article {
  author?: {
    id: string;
    email: string | null;
    full_name: string | null;
  } | null;
}
