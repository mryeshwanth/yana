"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { isOnboarded } from "@/lib/preferences";

export function UserShell({
  current,
  children,
}: {
  current: "parkings" | "roads" | "profile";
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
      <BottomNav current={current} />
    </div>
  );
}
