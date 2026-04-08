import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Candidate, ActivityLog } from "@/lib/models"
import { requireAdmin } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    await connectDB()
    const search = req.nextUrl.searchParams.get("search") || ""
    const status = req.nextUrl.searchParams.get("status") || ""

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {}

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ]
    }

    if (status) {
      filter.status = status
    }

    const candidates = await Candidate.find(filter).sort({ createdAt: -1 }).lean()

    void admin
    return NextResponse.json({ candidates })
  } catch (error) {
    console.error("Get candidates error:", error)
    return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    await connectDB()
    const body = await req.json()

    // Handle bulk insert (CSV upload)
    if (Array.isArray(body)) {
      const results = []
      for (const candidate of body) {
        const { name, email, mobile, event_name, customData } = candidate
        if (!name || !email || !event_name) continue
        const created = await Candidate.create({
          name,
          email,
          mobile: mobile || undefined,
          eventName: event_name,
          customData: typeof customData === 'object' && customData ? customData : {},
          createdByAdminId: admin.id,
        })
        results.push(created)
      }

      await ActivityLog.create({
        userId: admin.id,
        action: "bulk_add_candidates",
        details: `Added ${results.length} candidates via CSV`,
        userName: admin.name,
      })

      return NextResponse.json({ candidates: results, count: results.length })
    }

    // Single candidate
    const { name, email, mobile, event_name, customData } = body
    if (!name || !email || !event_name) {
      return NextResponse.json({ error: "Name, email and event name are required" }, { status: 400 })
    }

    const candidate = await Candidate.create({
      name,
      email,
      mobile: mobile || undefined,
      eventName: event_name,
      customData: typeof customData === 'object' && customData ? customData : {},
      createdByAdminId: admin.id,
    })

    await ActivityLog.create({
      userId: admin.id,
      action: "add_candidate",
      details: `Added candidate: ${name}`,
      userName: admin.name,
    })

    return NextResponse.json({ candidate })
  } catch (error) {
    console.error("Create candidate error:", error)
    return NextResponse.json({ error: "Failed to create candidate" }, { status: 500 })
  }
}
