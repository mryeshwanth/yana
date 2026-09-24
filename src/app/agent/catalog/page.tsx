import { redirect } from "next/navigation";
import { CatalogList } from "@/components/CatalogList";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AgentCatalogPage() {
  if (!(await isAdmin())) {
    redirect("/agent/login");
  }

  const lots = await prisma.parkingLot.findMany({ orderBy: { updatedAt: "desc" } });

  return <CatalogList lots={JSON.parse(JSON.stringify(lots))} />;
}
