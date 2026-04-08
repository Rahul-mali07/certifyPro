import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Candidate, ActivityLog } from "@/lib/models"
import { requireAdmin } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    await connectDB()
    const { id } = await params
    const { name, email, mobile, event_name, customData } = await req.json()

    const candidate = await Candidate.findByIdAndUpdate(
      id,
      {
        name,
        email,
        mobile: mobile || undefined,
        eventName: event_name,
        customData: typeof customData === 'object' && customData ? customData : {},
      },
      { new: true }
    )

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    await ActivityLog.create({
      userId: admin.id,
      action: "update_candidate",
      details: `Updated candidate: ${name}`,
      userName: admin.name,
    })

    return NextResponse.json({ candidate })
  } catch (error) {
    console.error("Update candidate error:", error)
    return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    await connectDB()
    const { id } = await params

    const candidate = await Candidate.findByIdAndDelete(id)

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    await ActivityLog.create({
      userId: admin.id,
      action: "delete_candidate",
      details: `Deleted candidate: ${candidate.name}`,
      userName: admin.name,
    })

    return NextResponse.json({ message: "Candidate deleted" })
  } catch (error) {
    console.error("Delete candidate error:", error)
    return NextResponse.json({ error: "Failed to delete candidate" }, { status: 500 })
  }
}
