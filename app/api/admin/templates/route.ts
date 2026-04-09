import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Template } from "@/lib/models"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    // await requireAdmin() // Temporarily disabled for testing
    await connectDB()

    // Get templates without sorting to avoid MongoDB memory issues
    let templates = await Template.find()
      .select('_id name description layoutKey fontStyle primaryColor accentColor isDefault backgroundUrl')
      .limit(100)
      .lean()
      .exec()
    
    // Sort templates in memory instead
    if (templates && Array.isArray(templates)) {
      templates = templates.sort((a: any, b: any) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
    }
    if (!templates || templates.length === 0) {
      // Auto-seed a default template
      const defaultTemplate = await Template.create({
        name: "Default Certificate",
        description: "This is a default auto-generated template.",
        layoutKey: "classic",
        fontStyle: "serif",
        primaryColor: "#1e3a5f",
        accentColor: "#c8a45a",
        logoUrl: "",
        backgroundUrl: "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png",
        signatureUrl: "",
        logos: [],
        signatures: [],
        signaturePosition: undefined,
        logoPosition: undefined,
        fields: [],
        customFields: [],
        elementPositions: undefined,
        enabledElements: {
          title: true,
          description: true,
          candidateName: true,
          eventName: true,
          logo: true,
          signature: true,
          date: true,
          qr: true,
          customFields: true,
        },
        elementSizes: {
          title: { fontSize: 48, fontWeight: 'bold' },
          description: { fontSize: 14 },
          candidateName: { fontSize: 40, fontWeight: 'bold' },
          eventName: { fontSize: 24 },
          logo: { width: 100, height: 100 },
          signature: { width: 150, height: 60 },
        },
        isDefault: true,
      })
      templates = [(defaultTemplate as any).toJSON ? (defaultTemplate as any).toJSON() : (defaultTemplate as any)]
    }
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
