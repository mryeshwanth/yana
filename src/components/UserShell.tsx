"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BottomNav, type NavTab } from "@/components/BottomNav";
import { ReviewSnackbar } from "@/components/ReviewSnackbar";
import { isOnboarded } from "@/lib/preferences";

export function UserShell({
  current,
  children,
}: {
  current: NavTab;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isOnboarded()) {
      router.replace("/onboarding");
    }
  }, [router]);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg pb-nav">
      {children}
      <ReviewSnackbar />
      <BottomNav current={current} />
    </div>
  );
}
