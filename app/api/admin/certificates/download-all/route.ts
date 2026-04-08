import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Certificate } from "@/lib/models"
import { requireAdmin } from "@/lib/auth"
import JSZip from "jszip"

export async function GET() {
  try {
    await requireAdmin()
    await connectDB()

    const certificates = await Certificate.find()
      .select("certificateData candidateName certificateId")
      .sort({ createdAt: -1 })
      .lean()

    if (certificates.length === 0) {
      return NextResponse.json({ error: "No certificates to download" }, { status: 404 })
    }

    const zip = new JSZip()

    for (const cert of certificates) {
      if (!cert.certificateData) continue
      const pdfBuffer = Buffer.from(cert.certificateData, "base64")
      const safeName = cert.candidateName.replace(/[^a-zA-Z0-9]/g, "_")
      zip.file(`${safeName}_${cert.certificateId}.pdf`, pdfBuffer)
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="certificates_all.zip"`,
      },
    })
  } catch (error) {
    console.error("Bulk download error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}
