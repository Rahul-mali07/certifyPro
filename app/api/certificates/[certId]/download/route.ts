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
      .select("certificateData candidateName certificateId")
      .lean()

    if (!cert || !cert.certificateData) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    const pdfBuffer = Buffer.from(cert.certificateData, "base64")

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${cert.certificateId}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}
