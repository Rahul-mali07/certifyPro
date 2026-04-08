import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { Organization } from "@/lib/models"
import { SignJWT } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] Organization login started")
    await connectDB()
    console.log("[v0] DB connected for org login")
    
    const { email, password } = await req.json()
    console.log("[v0] Org login attempt for:", email)

    if (!email || !password) {
      console.log("[v0] Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const organization = await Organization.findOne({ email })
    console.log("[v0] Organization found:", organization ? "yes" : "no")
    
    if (!organization) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, organization.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (!organization.isActive) {
      return NextResponse.json({ error: "Organization is deactivated" }, { status: 403 })
    }

    // Create organization token
    const token = await new SignJWT({
      id: organization._id.toString(),
      name: organization.name,
      email: organization.email,
      type: "organization",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET)

    const response = NextResponse.json({
      organization: {
        id: organization._id,
        name: organization.name,
        email: organization.email,
      },
      message: "Login successful",
    })

    response.cookies.set("org-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Organization login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
