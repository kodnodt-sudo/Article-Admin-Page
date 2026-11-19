"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#FAFAFA] px-4">
      <div className="w-full max-w-[380px] rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <Suspense
          fallback={
            <div className="h-32 animate-pulse rounded-md bg-[#FAFAFA]" />
          }
        >
          <LoginForm isConfigured={true} />
        </Suspense>
      </div>
    </div>
  );
}
