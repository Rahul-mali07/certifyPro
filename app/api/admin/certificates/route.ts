import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Certificate } from "@/lib/models"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    await connectDB()
    const search = req.nextUrl.searchParams.get("search") || ""

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {}

    if (search) {
      filter.$or = [
        { candidateName: { $regex: search, $options: "i" } },
        { certificateId: { $regex: search, $options: "i" } },
        { eventName: { $regex: search, $options: "i" } },
      ]
    }

    const certificates = await Certificate.find(filter)
      .select("candidateName certificateId eventName issueDate templateId createdAt")
      .populate("templateId", "name")
      .sort({ createdAt: -1 })
      .lean()

    // Map to expected format for frontend
    const mapped = certificates.map((c) => ({
      ...c,
      _id: c._id,
      template_name: (c.templateId as { name?: string })?.name || "Unknown",
    }))

    return NextResponse.json({ certificates: mapped })
  } catch (error) {
    console.error("Get certificates error:", error)
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 })
  }
}
