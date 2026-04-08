import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Candidate, Certificate, Template, ActivityLog } from "@/lib/models"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()
    await connectDB()

    const [totalCandidates, totalCertificates, totalTemplates, recentActivity, monthlyData] =
      await Promise.all([
        Candidate.countDocuments(),
        Certificate.countDocuments(),
        Template.countDocuments(),
        ActivityLog.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        Certificate.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
            },
          },
          {
            $group: {
              _id: { $month: "$createdAt" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ])

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const certificatesByMonth = monthlyData.map((m: { _id: number; count: number }) => ({
      month: monthNames[m._id - 1],
      count: m.count,
    }))

    // Map activity log to expected format
    const formattedActivity = recentActivity.map((log) => ({
      id: log._id,
      action: log.action,
      user_name: log.userName || "System",
      created_at: log.createdAt,
      details: log.details,
    }))

    return NextResponse.json({
      totalCandidates,
      totalCertificates,
      totalTemplates,
      recentActivity: formattedActivity,
      certificatesByMonth,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
