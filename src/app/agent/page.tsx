import { redirect } from "next/navigation";
import { ParkingFinder } from "@/components/ParkingFinder";
import { isAdmin } from "@/lib/auth";

export default async function AgentParkingPage() {
  if (!(await isAdmin())) {
    redirect("/agent/login");
  }

  return <ParkingFinder />;
}
