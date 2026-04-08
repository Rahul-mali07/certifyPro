import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { connectDB } from "@/lib/db"
import { Organization } from "@/lib/models"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("org-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.type !== "organization") {
      return NextResponse.json({ error: "Invalid token type" }, { status: 401 })
    }

    await connectDB()
    const organization = await Organization.findById(payload.id).select("-passwordHash")
    
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json({ organization })
  } catch (error) {
    console.error("Get organization error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }
}
