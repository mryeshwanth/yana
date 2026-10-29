import { redirect } from "next/navigation";
import { ReviewList } from "@/components/ReviewList";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AgentReviewsPage() {
  if (!(await isAdmin())) {
    redirect("/agent/login");
  }

  const reviews = await prisma.parkingReview.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return <ReviewList reviews={JSON.parse(JSON.stringify(reviews))} />;
}
