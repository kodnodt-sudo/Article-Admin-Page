"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  Building2,
  Settings,
  Search,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { AdminContext } from "@/lib/supabase/server";

interface AdminShellProps {
  admin: AdminContext;
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ admin, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isEditorRoute = /\/companies\/[^/]+\/articles\/[^/]+/.test(pathname);

  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState(
    searchParams.get("q") ?? ""
  );

  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  React.useEffect(() => {
    setMobileNavOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchValue.trim();
    if (pathname.startsWith("/companies/") && pathname.split("/").length === 3) {
      const url = trimmed
        ? `${pathname}?q=${encodeURIComponent(trimmed)}`
        : pathname;
      router.push(url);
      return;
    }
    const target = trimmed
      ? `/dashboard?q=${encodeURIComponent(trimmed)}`
      : "/dashboard";
    router.push(target);
  }

  if (isEditorRoute) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="flex h-14 items-center justify-between border-b border-[#E5E7EB] px-4">
          <Link
            href="/dashboard"
            className="flex items-center focus-visible:outline-none"
          >
            <img
              src="/kodnod-logo.png"
              alt="KODNOD"
              className="h-8 w-auto rounded-md"
            />
          </Link>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
            className="rounded p-1 text-[#6B7280] hover:bg-[#F3F4F6] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="Main navigation" className="space-y-0.5 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/25",
                  isActive
                    ? "border border-[#E5E7EB] bg-white text-[#1E3A8A] shadow-sm"
                    : "border border-transparent text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-[#1E3A8A]" : "text-[#6B7280]"
                  )}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-[#E5E7EB] p-3">
        <div className="rounded-md border border-[#E5E7EB] bg-white px-2.5 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
            Workspace
          </p>
          <p className="mt-0.5 truncate text-[12px] font-medium text-[#111827]">
            7 Portfolio Companies
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-[#E5E7EB] bg-[#FAFAFA] lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/25 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <aside
            className="fixed inset-y-0 left-0 w-56 border-r border-[#E5E7EB] bg-[#FAFAFA]"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex min-h-screen flex-col lg:pl-56">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-[#E5E7EB] bg-white px-4 sm:px-6">
          <div className="flex flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              className="rounded-md border border-[#E5E7EB] p-1.5 text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#111827] lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>

            <form
              onSubmit={handleSearchSubmit}
              className="relative w-full max-w-sm"
              role="search"
            >
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search companies or articles..."
                aria-label="Search companies or articles"
                className="h-8 w-full rounded-md border border-[#E5E7EB] bg-[#FAFAFA] pl-8 pr-3 text-[13px] text-[#111827] placeholder:text-[#9CA3AF] transition-colors focus:border-[#1E3A8A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/15"
              />
            </form>
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[13px] text-[#111827] transition-colors hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/25"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#1E3A8A] text-[10px] font-semibold text-white">
                {admin.email.slice(0, 2).toUpperCase()}
              </span>
              <span className="hidden max-w-[180px] truncate sm:inline">
                {admin.email}
              </span>
              <ChevronDown
                className="h-3.5 w-3.5 text-[#6B7280]"
                aria-hidden="true"
              />
            </button>

            {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-1.5 w-60 rounded-md border border-[#E5E7EB] bg-white py-1 shadow-sm"
              >
                <div className="border-b border-[#E5E7EB] px-3 py-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
                    Signed in as
                  </p>
                  <p className="mt-0.5 truncate text-[13px] font-medium text-[#111827]">
                    {admin.email}
                  </p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#111827] hover:bg-[#FAFAFA] disabled:opacity-50"
                >
                  <LogOut
                    className="h-3.5 w-3.5 text-[#6B7280]"
                    aria-hidden="true"
                  />
                  <span>{signingOut ? "Signing out..." : "Sign out"}</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
