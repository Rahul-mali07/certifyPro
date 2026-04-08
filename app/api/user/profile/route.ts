import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const authUser = await requireAuth()
    await connectDB()

    const user = await User.findById(authUser.id).select("-passwordHash").lean()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await requireAuth()
    await connectDB()
    const { name, mobile } = await req.json()

    const user = await User.findByIdAndUpdate(
      authUser.id,
      { name, mobile: mobile || undefined },
      { new: true }
    ).select("-passwordHash").lean()

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await requireAuth()
    await connectDB()
    const { name, phone, orgName } = await req.json()

    const updateData: Record<string, string | undefined> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (orgName !== undefined) updateData.orgName = orgName

    const user = await User.findByIdAndUpdate(
      authUser.id,
      updateData,
      { new: true }
    ).select("-passwordHash").lean()

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
