import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"

/** Lists centers from the same DB as the rest of the app — for the check-in demo picker. */
export async function GET() {
  const centers = await prisma.center.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
  })
  return NextResponse.json({ centers })
}
