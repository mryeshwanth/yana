import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REASON_LABEL = {
  close_enough: "Close enough",
  too_far: "Too far / hard to find",
  used_other: "Used another lot",
} as const;

export default async function AgentReviewsPage() {
  if (!(await isAdmin())) {
    redirect("/agent/login");
  }

  const reviews = await prisma.parkingReview.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-5 py-8">
      <header className="flex items-center justify-between gap-4">
        <BrandMark />
        <div className="flex items-center gap-4 text-sm">
          <Link href="/agent" className="text-ink-soft underline-offset-4 hover:underline">
            Finder
          </Link>
          <Link href="/agent/suggestions" className="text-ink-soft underline-offset-4 hover:underline">
            Suggestions
          </Link>
          <Link href="/agent/catalog" className="text-ink-soft underline-offset-4 hover:underline">
            Catalog
          </Link>
        </div>
      </header>
      <h1 className="mt-10 text-3xl font-semibold">Reviews</h1>
      <p className="mt-3 text-ink-soft">
        Thumbs from the post-Maps snackbar. This is trip feedback, not Live availability.
      </p>
      <div className="mt-8 space-y-3 pb-12">
        {reviews.length === 0 && (
          <p className="rounded-[4px] border border-line bg-white px-4 py-4 text-sm text-ink-soft">
            No reviews yet.
          </p>
        )}
        {reviews.map((review) => (
          <article key={review.id} className="rounded-[4px] border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{review.lotName}</h2>
                <p className="mt-1 text-sm text-ink-soft">for {review.destName}</p>
              </div>
              <span className="shrink-0 text-sm font-medium">
                {review.thumb === "up" ? "Useful" : "Not useful"}
              </span>
            </div>
            <p className="mt-3 text-sm">{REASON_LABEL[review.reason]}</p>
            <p className="mt-2 text-xs text-ink-soft">
              {review.createdAt.toLocaleString("en-IN")}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
