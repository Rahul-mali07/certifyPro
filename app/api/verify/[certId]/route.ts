import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Certificate } from "@/lib/models"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ certId: string }> }
) {
  try {
    await connectDB()
    const { certId } = await params

    const cert = await Certificate.findOne({ certificateId: certId })
      .populate("templateId", "name")
      .lean()

    if (!cert) {
      return NextResponse.json({ verified: false, error: "Certificate not found" }, { status: 404 })
    }

    return NextResponse.json({
      verified: true,
      certificate: {
        certificateId: cert.certificateId,
        candidateName: cert.candidateName,
        eventName: cert.eventName,
        issueDate: cert.issueDate,
        issuedAt: cert.createdAt,
        templateName: (cert.templateId as { name?: string })?.name || "Standard",
        qrCodeUrl: cert.qrCodeUrl,
        verificationUrl: cert.verificationUrl,
      },
    })
  } catch (error) {
    console.error("Verify error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
