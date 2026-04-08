import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Notification } from "@/lib/models"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()
    await connectDB()

    const notifications = await Notification.find()
      .sort({ sentAt: -1 })
      .lean()

    // Map to expected frontend format
    const mapped = notifications.map((n) => ({
      ...n,
      _id: n._id,
      cert_code: n.certCode,
      candidate_name: n.candidateName,
      recipient_email: n.recipientEmail,
      recipient_mobile: n.recipientMobile,
      sent_at: n.sentAt,
    }))

    return NextResponse.json({ notifications: mapped })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
