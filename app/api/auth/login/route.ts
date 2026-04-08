import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { User, ActivityLog } from "@/lib/models"
import { createToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] Login attempt started")
    await connectDB()
    console.log("[v0] Database connected")
    
    const { email, password } = await req.json()
    console.log("[v0] Login attempt for:", email)

    if (!email || !password) {
      console.log("[v0] Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await User.findOne({ email })
    console.log("[v0] User found:", user ? "yes" : "no")

    if (!user) {
      console.log("[v0] User not found for email:", email)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash)
    console.log("[v0] Password valid:", validPassword)

    if (!validPassword) {
      console.log("[v0] Invalid password for user:", email)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const token = await createToken({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId?.toString(),
      orgName: user.orgName,
    })

    // Log activity
    await ActivityLog.create({
      userId: user._id,
      action: "login",
      details: "User logged in from web",
      userName: user.name,
    })

    const response = NextResponse.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      message: "Login successful",
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
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
