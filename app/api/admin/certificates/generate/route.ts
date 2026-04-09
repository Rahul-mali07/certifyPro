import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Candidate, Certificate, Template, User, Notification, ActivityLog } from "@/lib/models"
import { requireAdmin } from "@/lib/auth"
import { generateCertificatePDF } from "@/lib/certificate-generator"
import { nanoid } from "nanoid"
import { Types } from "mongoose"

function generateCertId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = "CERT-"
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Helper to validate MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id)
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    await connectDB()
    const { candidateIds, templateId } = await req.json()

    // Validate input
    if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return NextResponse.json({ error: "No candidates selected" }, { status: 400 })
    }

    if (!templateId) {
      return NextResponse.json({ error: "Template is required - no template selected" }, { status: 400 })
    }

    // Validate template ID format
    if (typeof templateId !== 'string' || !templateId.trim()) {
      return NextResponse.json({ error: "Invalid template ID provided" }, { status: 400 })
    }

    const cleanTemplateId = String(templateId).trim()

    if (!isValidObjectId(cleanTemplateId)) {
      return NextResponse.json({ error: "Invalid template ID format - template does not exist" }, { status: 400 })
    }

    // Get template
    const template = await Template.findById(cleanTemplateId)
    if (!template) {
      return NextResponse.json({ error: "Template not found - please select a valid template" }, { status: 404 })
    }

    console.log("Template loaded:", {
      name: template.name,
      logoUrl: template.logoUrl ? "present" : "absent",
      signatureUrl: template.signatureUrl ? "present" : "absent",
      backgroundUrl: template.backgroundUrl ? `present (${template.backgroundUrl.substring(0, 50)}...)` : "absent/empty",
      elementPositions: (template as any).elementPositions,
      enabledElements: (template as any).enabledElements,
    })

    // Validate candidate IDs
    const validCandidateIds = candidateIds.filter(id => isValidObjectId(String(id)))
    if (validCandidateIds.length === 0) {
      return NextResponse.json({ error: "No valid candidates selected" }, { status: 400 })
    }

    // Get candidates (allow both pending and generated for re-generation)
    const candidates = await Candidate.find({
      _id: { $in: validCandidateIds },
    })

    if (candidates.length === 0) {
      return NextResponse.json({ error: "No candidates found in selection" }, { status: 400 })
    }

    const baseUrl = req.nextUrl.origin
    const generatedCerts = []

    for (const candidate of candidates) {
      const certId = generateCertId()
      const serialNumber = nanoid(12)
      const verificationId = nanoid(16)
      const verificationUrl = `${baseUrl}/verify/${certId}`
      const issueDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      // Force enable all essential elements including title, description, background, and logo
      const forcedEnabledElements = {
        ...(template.enabledElements || {}),
        title: true,
        description: true,
        candidateName: true,
        eventName: true,
        logo: true,
        signature: true,
        date: true,
        qr: true,
        customFields: true,
      }
      
      // Ensure backgroundUrl is properly set
      const backgroundUrl = template.backgroundUrl && template.backgroundUrl.trim() ? template.backgroundUrl : undefined
      
      console.log(`[Certificate Generation] Generating for candidate: ${candidate.name}, backgroundUrl: ${backgroundUrl ? 'SET' : 'MISSING'}`)
      
      const { pdfBytes, qrCodeData } = await generateCertificatePDF({
        candidateName: candidate.name,
        eventName: candidate.eventName,
        issueDate,
        certificateId: certId,
        templateLayout: template.layoutKey,
        primaryColor: template.primaryColor,
        accentColor: template.accentColor,
        fontStyle: template.fontStyle,
        verificationUrl,
        backgroundUrl: backgroundUrl,
        backgroundPosition: (template as any).backgroundPosition,
        logoUrl: template.logoUrl,
        signatureUrl: template.signatureUrl,
        logos: (template as any).logos || [],
        signatures: (template as any).signatures || [],
        signaturePosition: template.signaturePosition,
        logoPosition: (template as any).logoPosition,
        elementPositions: (template as any).elementPositions,
        enabledElements: forcedEnabledElements,
        elementSizes: (template as any).elementSizes,
        title: template.name || "Certificate",
        description: template.description || "",
        customFields: (template as any).customFields || [],
        candidateCustomData: candidate.customData || {},
      })

      // Store certificate as base64
      const pdfBase64 = Buffer.from(pdfBytes).toString("base64")

      // Check if candidate has a linked user account
      const linkedUser = await User.findOne({ email: candidate.email })
      const userId = linkedUser ? linkedUser._id : undefined

      const cert = await Certificate.create({
        certificateId: certId,
        serialNumber,
        verificationId,
        candidateId: candidate._id,
        userId,
        templateId: template._id,
        eventName: candidate.eventName,
        candidateName: candidate.name,
        certificateData: pdfBase64,
        qrCodeData,
        qrCodeUrl: qrCodeData, // Store QR code as URL for display
        verificationUrl,
        generationInstance: (candidate.certificateCount || 0) + 1,
      })

      // Update candidate status and increment certificate count
      candidate.status = "generated"
      candidate.certificateCount = (candidate.certificateCount || 0) + 1
      if (userId) candidate.userId = userId
      await candidate.save()

      // Create notification record
      await Notification.create({
        certificateId: cert._id,
        recipientEmail: candidate.email,
        recipientMobile: candidate.mobile,
        type: "email",
        status: "sent",
        certCode: certId,
        candidateName: candidate.name,
      })

      generatedCerts.push({
        certificateId: certId,
        candidateName: candidate.name,
        eventName: candidate.eventName,
      })
    }

    await ActivityLog.create({
      userId: admin.id,
      action: "generate_certificates",
      details: `Generated ${generatedCerts.length} certificates using template: ${template.name}`,
      userName: admin.name,
    })

    return NextResponse.json({
      message: `Successfully generated ${generatedCerts.length} certificates`,
      certificates: generatedCerts,
      count: generatedCerts.length,
    })
  } catch (error) {
    console.error("Generate certificates error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to generate certificates" }, { status: 500 })
  }
}
