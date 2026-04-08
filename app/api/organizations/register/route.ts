import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { Organization, AdminCode } from "@/lib/models"
import { nanoid } from "nanoid"

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] Organization registration started")
    await connectDB()
    console.log("[v0] Database connected")
    
    const body = await req.json()
    const { name, email, password } = body
    console.log("[v0] Request body:", { name, email, passwordLength: password?.length })

    if (!name || !email || !password) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Organization name, email and password are required" }, { status: 400 })
    }

    // Check if organization exists
    const existing = await Organization.findOne({ email })
    console.log("[v0] Existing org check:", existing ? "found" : "not found")
    if (existing) {
      return NextResponse.json({ error: "Organization with this email already exists" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    console.log("[v0] Password hashed")

    // Create organization
    const organization = await Organization.create({
      name,
      email,
      passwordHash,
      isActive: true,
    })
    console.log("[v0] Organization created:", organization._id)

    // Create default admin code for this organization
    const defaultCode = `${name.substring(0, 3).toUpperCase()}-${nanoid(8)}`
    console.log("[v0] Generated admin code:", defaultCode)
    
    await AdminCode.create({
      code: defaultCode,
      organizationId: organization._id,
      organizationName: organization.name,
      description: "Default admin code",
      isActive: true,
    })
    console.log("[v0] Admin code created")

    return NextResponse.json({
      organization: {
        id: organization._id,
        name: organization.name,
        email: organization.email,
      },
      adminCode: defaultCode,
      message: "Organization registered successfully. Use the admin code to register admins.",
    })
  } catch (error) {
    console.error("[v0] Organization registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
