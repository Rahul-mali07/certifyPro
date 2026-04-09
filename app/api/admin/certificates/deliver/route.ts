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
      console.log("[v0] Starting email delivery for", certificates.length, "certificates")
      let successCount = 0
      let failCount = 0

      const emailPromises = certificates.map((cert: any) =>
        (async () => {
          const candidateEmail = cert.candidateId?.email || recipientEmail
          console.log(`[v0] Processing email for ${cert.candidateName}: ${candidateEmail || "no email"}`)
          
          if (!candidateEmail) {
            console.warn(`[v0] No email found for ${cert.candidateName}`)
            await Notification.create({
              certificateId: cert._id,
              recipientEmail: "no-email@unknown.com",
              type: "email",
              deliveryMethod: "email",
              status: "failed",
              certCode: cert.certificateId,
              candidateName: cert.candidateName,
            })
            failCount++
            return
          }

          try {
            const result = await sendEmailNotification({
              to: candidateEmail,
              candidateName: cert.candidateName,
              eventName: cert.eventName || "your event",
              certificateId: cert.certificateId,
              verificationUrl: cert.verificationUrl,
            })

            console.log(`[v0] Email result for ${cert.candidateName}:`, result)

            await Notification.create({
              certificateId: cert._id,
              recipientEmail: candidateEmail,
              type: "email",
              deliveryMethod: "email",
              status: "sent",
              certCode: cert.certificateId,
              candidateName: cert.candidateName,
            })
            successCount++
          } catch (error) {
            console.error("[v0] Email send error for", cert.candidateName, ":", error)
            await Notification.create({
              certificateId: cert._id,
              recipientEmail: candidateEmail,
              type: "email",
              deliveryMethod: "email",
              status: "failed",
              certCode: cert.certificateId,
              candidateName: cert.candidateName,
            })
            failCount++
          }
        })()
      )

      await Promise.all(emailPromises)

      console.log(`[v0] Email delivery complete: ${successCount} sent, ${failCount} failed`)

      return NextResponse.json({
        success: true,
        message: `Certificates sent via email (${successCount} sent, ${failCount} failed)`,
        count: certificates.length,
        sent: successCount,
        failed: failCount,
      })
    }

    if (deliveryMethod === "sms") {
      console.log("[v0] Starting SMS delivery for", certificates.length, "certificates")
      let successCount = 0
      let failCount = 0

      const smsPromises = certificates.map((cert: any) =>
        (async () => {
          const phoneNumber = cert.candidateId?.mobile || recipientPhone
          console.log(`[v0] Processing SMS for ${cert.candidateName}: ${phoneNumber || "no phone"}`)
          
          if (!phoneNumber) {
            console.warn(`[v0] No phone number found for ${cert.candidateName}`)
            await Notification.create({
              certificateId: cert._id,
              recipientEmail: cert.candidateId?.email || "unknown",
              recipientMobile: "unknown",
              type: "sms",
              deliveryMethod: "sms",
              status: "failed",
              certCode: cert.certificateId,
              candidateName: cert.candidateName,
            })
            failCount++
            return
          }

          try {
            const result = await sendSMSNotification({
              to: phoneNumber,
              candidateName: cert.candidateName,
              eventName: cert.eventName || "Event",
              certificateId: cert.certificateId,
              verificationUrl: cert.verificationUrl,
            })

            console.log(`[v0] SMS result for ${cert.candidateName}:`, result)

            await Notification.create({
              certificateId: cert._id,
              recipientEmail: cert.candidateId?.email || "unknown",
              recipientMobile: phoneNumber,
              type: "sms",
              deliveryMethod: "sms",
              status: "sent",
              certCode: cert.certificateId,
              candidateName: cert.candidateName,
            })
            successCount++
          } catch (error) {
            console.error("[v0] SMS send error for", cert.candidateName, ":", error)
            await Notification.create({
              certificateId: cert._id,
              recipientEmail: cert.candidateId?.email || "unknown",
              recipientMobile: phoneNumber,
              type: "sms",
              deliveryMethod: "sms",
              status: "failed",
              certCode: cert.certificateId,
              candidateName: cert.candidateName,
            })
            failCount++
          }
        })()
      )

      await Promise.all(smsPromises)

      console.log(`[v0] SMS delivery complete: ${successCount} sent, ${failCount} failed`)

      return NextResponse.json({
        success: true,
        message: `Certificates sent via SMS (${successCount} sent, ${failCount} failed)`,
        count: certificates.length,
        sent: successCount,
        failed: failCount,
      })
    }

    return NextResponse.json({ error: "Invalid delivery method" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Delivery error:", error)
    return NextResponse.json({ error: "Failed to deliver certificates" }, { status: 500 })
  }
}
