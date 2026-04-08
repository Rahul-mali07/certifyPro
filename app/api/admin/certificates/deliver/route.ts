import { connectDB } from "@/lib/db"
import { Certificate, Notification } from "@/lib/models"
import { requireAdmin } from "@/lib/auth"
import { sendEmailNotification, sendSMSNotification } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    await connectDB()

    const body = await request.json()
    const { certificateIds, deliveryMethod, recipientEmail, recipientPhone } = body

    if (!certificateIds || certificateIds.length === 0) {
      return NextResponse.json({ error: "No certificates selected" }, { status: 400 })
    }


    // Fetch selected certificates
    const certificates = await Certificate.find({
      _id: { $in: certificateIds },
    }).populate("candidateId")

    if (certificates.length === 0) {
      return NextResponse.json({ error: "Certificates not found" }, { status: 404 })
    }

    // Handle different delivery methods
    if (deliveryMethod === "download") {
      // For download, we'll prepare the ZIP - actual file preparation happens on client
      await Promise.all(
        certificates.map((cert: any) =>
          Notification.create({
            certificateId: cert._id,
            recipientEmail: cert.candidateId?.email || "unknown",
            recipientMobile: cert.candidateId?.mobile,
            type: "download",
            deliveryMethod: "download",
            status: "sent",
            certCode: cert.certificateId,
            candidateName: cert.candidateName,
          })
        )
      )

      return NextResponse.json({
        success: true,
        message: "Certificates ready for download",
        count: certificates.length,
      })
    }

    if (deliveryMethod === "email") {
      const emailPromises = certificates.map((cert: any) =>
        (async () => {
          const candidateEmail = cert.candidateId?.email || recipientEmail
          if (!candidateEmail) {
            await Notification.create({
              certificateId: cert._id,
              recipientEmail: "unknown",
              type: "email",
              deliveryMethod: "email",
              status: "failed",
              certCode: cert.certificateId,
              candidateName: cert.candidateName,
            })
            return
          }

          try {
            await sendEmailNotification({
              to: candidateEmail,
              candidateName: cert.candidateName,
              eventName: cert.eventName || "your event",
              certificateId: cert.certificateId,
              verificationUrl: cert.verificationUrl,
            })

            await Notification.create({
              certificateId: cert._id,
              recipientEmail: candidateEmail,
              type: "email",
              deliveryMethod: "email",
              status: "sent",
              certCode: cert.certificateId,
              candidateName: cert.candidateName,
            })
          } catch (error) {
            console.error("[v0] Email send error:", error)
            await Notification.create({
              certificateId: cert._id,
              recipientEmail: candidateEmail,
              type: "email",
              deliveryMethod: "email",
              status: "failed",
              certCode: cert.certificateId,
              candidateName: cert.candidateName,
            })
          }
        })()
      )

      await Promise.all(emailPromises)

      return NextResponse.json({
        success: true,
        message: "Certificates sent via email",
        count: certificates.length,
      })
    }

    if (deliveryMethod === "sms") {
      const smsPromises = certificates.map((cert: any) =>
        (async () => {
          const phoneNumber = cert.candidateId?.mobile || recipientPhone
          if (!phoneNumber) {
            await Notification.create({
              certificateId: cert._id,
              recipientMobile: "unknown",
              type: "sms",
              deliveryMethod: "sms",
              status: "failed",
              certCode: cert.certificateId,
              candidateName: cert.candidateName,
            })
            return
          }

          try {
            await sendSMSNotification({
              to: phoneNumber,
              candidateName: cert.candidateName,
              eventName: cert.eventName || "Event",
              certificateId: cert.certificateId,
              verificationUrl: cert.verificationUrl,
            })

            await Notification.create({
              certificateId: cert._id,
              recipientMobile: phoneNumber,
              type: "sms",
              deliveryMethod: "sms",
              status: "sent",
              certCode: cert.certificateId,
              candidateName: cert.candidateName,
            })
          } catch (error) {
            console.error("[v0] SMS send error:", error)
            await Notification.create({
              certificateId: cert._id,
              recipientMobile: phoneNumber,
              type: "sms",
              deliveryMethod: "sms",
              status: "failed",
              certCode: cert.certificateId,
              candidateName: cert.candidateName,
            })
          }
        })()
      )

      await Promise.all(smsPromises)

      return NextResponse.json({
        success: true,
        message: "Certificates sent via SMS",
        count: certificates.length,
      })
    }

    return NextResponse.json({ error: "Invalid delivery method" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Delivery error:", error)
    return NextResponse.json({ error: "Failed to deliver certificates" }, { status: 500 })
  }
}
