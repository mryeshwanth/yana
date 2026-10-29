import { redirect } from "next/navigation";
import { SuggestionList } from "@/components/SuggestionList";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AgentSuggestionsPage() {
  if (!(await isAdmin())) {
    redirect("/agent/login");
  }

  const suggestions = await prisma.parkingSuggestion.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <SuggestionList suggestions={JSON.parse(JSON.stringify(suggestions))} />;
}
