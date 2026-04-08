import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { connectDB } from "@/lib/db"
import { AdminCode } from "@/lib/models"
import { nanoid } from "nanoid"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

async function getOrgFromToken(req: NextRequest) {
  const token = req.cookies.get("org-token")?.value
  if (!token) return null
  
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.type !== "organization") return null
    return payload as { id: string; name: string; email: string; type: string }
  } catch {
    return null
  }
}

// Get all admin codes for organization
export async function GET(req: NextRequest) {
  try {
    const org = await getOrgFromToken(req)
    if (!org) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()
    const codes = await AdminCode.find({ organizationId: org.id }).sort({ createdAt: -1 })

    return NextResponse.json({ codes })
  } catch (error) {
    console.error("Get admin codes error:", error)
    return NextResponse.json({ error: "Failed to fetch admin codes" }, { status: 500 })
  }
}

// Create new admin code
export async function POST(req: NextRequest) {
  try {
    const org = await getOrgFromToken(req)
    if (!org) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()
    const { description, maxUsage, expiresAt } = await req.json()

    const code = `${org.name.substring(0, 3).toUpperCase()}-${nanoid(8)}`

    const adminCode = await AdminCode.create({
      code,
      organizationId: org.id,
      organizationName: org.name,
      description: description || "Admin access code",
      maxUsage: maxUsage || undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive: true,
    })

    return NextResponse.json({
      code: adminCode,
      message: "Admin code created successfully",
    })
  } catch (error) {
    console.error("Create admin code error:", error)
    return NextResponse.json({ error: "Failed to create admin code" }, { status: 500 })
  }
}

// Delete/Deactivate admin code
export async function DELETE(req: NextRequest) {
  try {
    const org = await getOrgFromToken(req)
    if (!org) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const codeId = searchParams.get("id")

    if (!codeId) {
      return NextResponse.json({ error: "Code ID required" }, { status: 400 })
    }

    await connectDB()
    const adminCode = await AdminCode.findOne({ _id: codeId, organizationId: org.id })
    
    if (!adminCode) {
      return NextResponse.json({ error: "Admin code not found" }, { status: 404 })
    }

    await AdminCode.findByIdAndDelete(codeId)

    return NextResponse.json({ message: "Admin code deleted successfully" })
  } catch (error) {
    console.error("Delete admin code error:", error)
    return NextResponse.json({ error: "Failed to delete admin code" }, { status: 500 })
  }
}

// Toggle active status
export async function PATCH(req: NextRequest) {
  try {
    const org = await getOrgFromToken(req)
    if (!org) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id, isActive } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "Code ID required" }, { status: 400 })
    }

    await connectDB()
    const adminCode = await AdminCode.findOneAndUpdate(
      { _id: id, organizationId: org.id },
      { isActive },
      { new: true }
    )

    if (!adminCode) {
      return NextResponse.json({ error: "Admin code not found" }, { status: 404 })
    }

    return NextResponse.json({ code: adminCode, message: "Admin code updated successfully" })
  } catch (error) {
    console.error("Update admin code error:", error)
    return NextResponse.json({ error: "Failed to update admin code" }, { status: 500 })
  }
}
