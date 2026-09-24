import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ParkingFinder } from "@/components/ParkingFinder";

export default async function AdminParkingPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const [lots, suggestions] = await Promise.all([
    prisma.parkingLot.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.parkingSuggestion.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <ParkingFinder
      lots={JSON.parse(JSON.stringify(lots))}
      suggestions={JSON.parse(JSON.stringify(suggestions))}
    />
  );
}
