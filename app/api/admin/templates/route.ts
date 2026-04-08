import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Template } from "@/lib/models"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    // await requireAdmin() // Temporarily disabled for testing
    await connectDB()

    const templates = await Template.find().sort({ isDefault: -1, createdAt: 1 }).lean()
    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Get templates error:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    await connectDB()

    const body = await request.json()
    const {
      name,
      description,
      layoutKey = "classic",
      fontStyle = "serif",
      primaryColor = "#1e3a5f",
      accentColor = "#c8a45a",
      logoUrl,
      backgroundUrl,
      signatureUrl,
      logos = [],
      signatures = [],
      signaturePosition,
      logoPosition,
      customFields = [],
      fields = [],
      elementPositions,
      enabledElements,
      elementSizes,
    } = body

    if (!name) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 })
    }

    const template = await Template.create({
      name,
      description,
      layoutKey,
      fontStyle,
      primaryColor,
      accentColor,
      logoUrl,
      backgroundUrl,
      signatureUrl,
      logos,
      signatures,
      signaturePosition,
      logoPosition,
      fields,
      customFields,
      elementPositions,
      enabledElements,
      elementSizes,
      createdByAdminId: user.id,
    })

    return NextResponse.json(
      { template, message: "Template created successfully" },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Create template error:", error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}
