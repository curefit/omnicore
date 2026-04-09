import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"

export async function GET() {
  try {
    const configs = await prisma.servicePricingConfig.findMany({
      orderBy: { moduleKey: "asc" },
    })
    return NextResponse.json({ configs })
  } catch (err) {
    console.error("List pricing configs error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
