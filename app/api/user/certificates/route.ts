import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Certificate } from "@/lib/models"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const user = await requireAuth()
    await connectDB()

    const certificates = await Certificate.find({ userId: user.id })
      .select("candidateName certificateId eventName issueDate templateId createdAt")
      .populate("templateId", "name")
      .sort({ createdAt: -1 })
      .lean()

    const mapped = certificates.map((c) => ({
      ...c,
      template_name: (c.templateId as { name?: string })?.name || "Standard",
    }))

    return NextResponse.json({ certificates: mapped })
  } catch (error) {
    console.error("Get user certificates error:", error)
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 })
  }
}
