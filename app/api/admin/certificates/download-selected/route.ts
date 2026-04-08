import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { Certificate } from "@/lib/models"
import { requireAdmin } from "@/lib/auth"
import JSZip from "jszip"

export async function POST(request: Request) {
  try {
    await requireAdmin()
    await connectDB()

    const body = await request.json()
    const { certificateIds } = body

    if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
      return NextResponse.json({ error: "No certificates selected" }, { status: 400 })
    }

    const certificates = await Certificate.find({
      _id: { $in: certificateIds },
    })
      .select("certificateData candidateName certificateId")
      .lean()

    if (!certificates.length) {
      return NextResponse.json({ error: "Certificates not found" }, { status: 404 })
    }

    const zip = new JSZip()

    for (const cert of certificates) {
      if (!cert.certificateData) continue
      const pdfBuffer = Buffer.from(cert.certificateData, "base64")
      const safeName = (cert.candidateName || "candidate").replace(/[^a-zA-Z0-9]/g, "_")
      zip.file(`${safeName}_${cert.certificateId}.pdf`, pdfBuffer)
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })
    const zipArray = new Uint8Array(zipBuffer)

    return new NextResponse(zipArray, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="certificates_selected.zip"`,
      },
    })
  } catch (error) {
    console.error("Download selected error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}
