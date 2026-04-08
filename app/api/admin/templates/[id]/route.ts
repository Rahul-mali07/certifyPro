import { connectDB } from "@/lib/db"
import { Template } from "@/lib/models"
import { requireAdmin } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { Types } from "mongoose"

// Helper to validate MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params
    
    if (!paramId) {
      return NextResponse.json({ error: "Template id is required" }, { status: 400 })
    }

    const id = String(paramId).trim()

    // Validate that the ID is a valid MongoDB ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid template id format" }, { status: 400 })
    }

    console.log("[Template API] Fetching template with id:", id)
    await connectDB()

    const template = await Template.findById(id).lean()
    console.log("[Template API] Template found:", !!template)

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error("[Template API] Get template error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch template" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    await connectDB()

    const { id: paramId } = await params
    const id = String(paramId).trim()

    // Validate that the ID is a valid MongoDB ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid template id format" }, { status: 400 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 })
    }

    // Destructure all fields explicitly to ensure proper Mongoose array handling
    const {
      name,
      description,
      layoutKey,
      fontStyle,
      primaryColor,
      accentColor,
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

    const updateData = {
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
      customFields,
      fields,
      elementPositions,
      enabledElements,
      elementSizes,
      updatedAt: new Date(),
    }

    const template = await Template.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ template, message: "Template updated successfully" })
  } catch (error) {
    console.error("[Template API] Update template error:", error)
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    await connectDB()

    const { id: paramId } = await params
    const id = String(paramId).trim()

    // Validate that the ID is a valid MongoDB ObjectId
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid template id format" }, { status: 400 })
    }

    const template = await Template.findByIdAndDelete(id)
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Template deleted successfully" })
  } catch (error) {
    console.error("[Template API] Delete template error:", error)
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
  }
}
