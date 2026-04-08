import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { User, AdminCode } from "@/lib/models"
import { createToken } from "@/lib/auth"

// Default super admin secret code
const SUPER_ADMIN_CODE = process.env.ADMIN_SECRET_CODE || "Swapnil"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { name, email, mobile, password, role, adminSecretCode } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 })
    }

    let organizationId: string | undefined
    let orgName: string | undefined

    // If registering as admin, verify secret code
    if (role === "admin") {
      if (!adminSecretCode) {
        return NextResponse.json({ error: "Admin secret code is required" }, { status: 400 })
      }

      // First check if it's the super admin code
      if (adminSecretCode === SUPER_ADMIN_CODE) {
        // Super admin - no organization
        orgName = "Super Admin"
      } else {
        // Check organization admin codes
        const adminCode = await AdminCode.findOne({ code: adminSecretCode })
        
        if (!adminCode) {
          return NextResponse.json({ error: "Invalid admin secret code" }, { status: 403 })
        }

        if (!adminCode.isActive) {
          return NextResponse.json({ error: "This admin code has been deactivated" }, { status: 403 })
        }

        // Check expiry
        if (adminCode.expiresAt && new Date(adminCode.expiresAt) < new Date()) {
          return NextResponse.json({ error: "This admin code has expired" }, { status: 403 })
        }

        // Check max usage
        if (adminCode.maxUsage && adminCode.usageCount >= adminCode.maxUsage) {
          return NextResponse.json({ error: "This admin code has reached its usage limit" }, { status: 403 })
        }

        // Valid organization code
        organizationId = adminCode.organizationId.toString()
        orgName = adminCode.organizationName

        // Increment usage count
        await AdminCode.findByIdAndUpdate(adminCode._id, { $inc: { usageCount: 1 } })
      }
    }

    // Check if user exists
    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const userRole = role === "admin" ? "admin" : "user"

    const user = await User.create({
      name,
      email,
      mobile: mobile || undefined,
      passwordHash,
      role: userRole,
      organizationId: organizationId || undefined,
      orgName: orgName || undefined,
    })

    const token = await createToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: organizationId,
    })

    const response = NextResponse.json({
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        orgName: orgName,
      },
      message: "Registration successful",
    })
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] Register error:", error)
    const errorMessage = error instanceof Error ? error.message : "Registration failed"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
