"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ isConfigured = true }: { isConfigured?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mode, setMode] = React.useState<"login" | "completing" | "set-password">("login");

  React.useEffect(() => {
    if (!isConfigured || typeof window === "undefined") {
      return;
    }

    const hash = window.location.hash;
    const code = searchParams.get("code");

    if (!hash && !code) {
      return;
    }

    const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
    const hashError = hashParams.get("error_description") || hashParams.get("error");
    if (hashError) {
      setError(hashError);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      return;
    }

    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    const type = hashParams.get("type");

    if (!accessToken && !code) {
      return;
    }

    let cancelled = false;

    async function completeAuth() {
      setMode("completing");
      setError(null);

      try {
        const supabase = createClient();

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        } else if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else {
          return;
        }

        if (cancelled) return;

        window.history.replaceState(null, "", window.location.pathname);

        if (type === "invite" || type === "recovery") {
          setMode("set-password");
          return;
        }

        const target =
          nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
            ? nextPath
            : "/dashboard";
        router.replace(target);
        router.refresh();
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to complete sign-in from the link. Please try again."
        );
        setMode("login");
      }
    }

    void completeAuth();

    return () => {
      cancelled = true;
    };
  }, [isConfigured, nextPath, router, searchParams]);

  async function handleSetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        setIsSubmitting(false);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Network error while saving password. Please try again.");
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isConfigured) {
      setError(
        "Supabase environment variables are not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local and restart the dev server."
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter both your email address and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes("invalid login")) {
          setError("Invalid email or password. Please check your credentials.");
        } else {
          setError(signInError.message);
        }
        setIsSubmitting(false);
        return;
      }

      if (!data.session) {
        setError("Unable to establish a session. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const target =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/dashboard";

      router.replace(target);
      router.refresh();
    } catch {
      setError(
        "Network error while signing in. Check your connection and try again."
      );
      setIsSubmitting(false);
    }
  }

  if (mode === "completing") {
    return (
      <div className="rounded-md border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-6 text-center text-[13px] text-[#4B5563]">
        Verifying your invitation link and signing you in...
      </div>
    );
  }

  if (mode === "set-password") {
    return (
      <form onSubmit={handleSetPassword} className="space-y-4" noValidate>
        <div className="rounded-md border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5 text-[12px] leading-relaxed text-[#4B5563]">
          Your invitation has been accepted. Set a password for your account to continue.
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-[13px] text-[#991B1B]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="new-password"
            className="block text-[13px] font-medium text-[#111827]"
          >
            New password
          </label>
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirm-password"
            className="block text-[13px] font-medium text-[#111827]"
          >
            Confirm password
          </label>
          <Input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Saving password..." : "Set password & continue"}
        </Button>

        <button
          type="button"
          onClick={() => {
            router.replace("/dashboard");
            router.refresh();
          }}
          disabled={isSubmitting}
          className="w-full text-center text-[12px] text-[#6B7280] hover:text-[#111827]"
        >
          Skip for now and go to dashboard
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {!isConfigured && (
        <div
          role="status"
          className="rounded-md border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2.5 text-[12px] leading-relaxed text-[#4B5563]"
        >
          <span className="font-medium text-[#111827]">Setup required:</span>{" "}
          Create <code className="rounded bg-[#F3F4F6] px-1 py-0.5">.env.local</code>{" "}
          with <code className="rounded bg-[#F3F4F6] px-1 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          and <code className="rounded bg-[#F3F4F6] px-1 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,
          then restart the server.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-[13px] text-[#991B1B]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-[13px] font-medium text-[#111827]"
        >
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-[13px] font-medium text-[#111827]"
        >
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={isSubmitting}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#6B7280] hover:text-[#111827] focus-visible:outline-none focus-visible:text-[#1E3A8A]"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={isSubmitting}
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
