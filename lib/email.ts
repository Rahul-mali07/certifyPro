import nodemailer from "nodemailer"
import twilio from "twilio"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Twilio client for SMS
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

interface SendCertificateEmailOptions {
  to: string
  candidateName: string
  eventName: string
  certificateId: string
  pdfBuffer: Buffer
  verificationUrl: string
}

export async function sendCertificateEmail(options: SendCertificateEmailOptions) {
  const { to, candidateName, eventName, certificateId, pdfBuffer, verificationUrl } = options

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@certifypro.com"

  await transporter.sendMail({
    from: `"CertifyPro" <${fromAddress}>`,
    to,
    subject: `Your Certificate for ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #1B2A4A;">
          <h1 style="color: #1B2A4A; margin: 0;">CertifyPro</h1>
          <p style="color: #666; margin: 5px 0 0;">Certificate Generation & Management</p>
        </div>
        <div style="padding: 30px 0;">
          <h2 style="color: #1B2A4A;">Congratulations, ${candidateName}!</h2>
          <p style="color: #333; line-height: 1.6;">
            Your certificate for <strong>${eventName}</strong> has been generated successfully.
            Please find the certificate attached to this email as a PDF file.
          </p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Certificate ID:</strong> ${certificateId}<br/>
              <strong>Verify online:</strong> <a href="${verificationUrl}" style="color: #1B2A4A;">${verificationUrl}</a>
            </p>
          </div>
          <p style="color: #333; line-height: 1.6;">
            You can verify the authenticity of your certificate anytime using the verification link above
            or by scanning the QR code on the certificate.
          </p>
        </div>
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>This is an automated email from CertifyPro. Please do not reply.</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `certificate-${certificateId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  })
}

interface SendCertificateNotificationEmailOptions {
  to: string
  candidateName: string
  eventName: string
  certificateId: string
  verificationUrl: string
}

export async function sendCertificateNotificationEmail(options: SendCertificateNotificationEmailOptions) {
  const { to, candidateName, eventName, certificateId, verificationUrl } = options
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@certifypro.com"

  await transporter.sendMail({
    from: `"CertifyPro" <${fromAddress}>`,
    to,
    subject: `Your Certificate for ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #1B2A4A;">
          <h1 style="color: #1B2A4A; margin: 0;">CertifyPro</h1>
        </div>
        <div style="padding: 30px 0;">
          <h2 style="color: #1B2A4A;">Hello ${candidateName},</h2>
          <p style="color: #333; line-height: 1.6;">
            Your certificate for <strong>${eventName}</strong> has been generated successfully.
            Use the link below to verify your certificate.
          </p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Certificate ID:</strong> ${certificateId}<br/>
              <strong>Verification link:</strong> <a href="${verificationUrl}" style="color: #1B2A4A;">${verificationUrl}</a>
            </p>
          </div>
          <p style="color: #333; line-height: 1.6;">
            Thank you for participating in <strong>${eventName}</strong>.
          </p>
        </div>
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px;">
          <p>This is an automated message from CertifyPro.</p>
        </div>
      </div>
    `,
  })
}

interface SendCertificateSMSOptions {
  to: string
  candidateName: string
  eventName: string
  certificateId: string
  verificationUrl: string
}

export async function sendCertificateSMS(options: SendCertificateSMSOptions) {
  const { to, candidateName, eventName, certificateId, verificationUrl } = options

  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn("[v0] Twilio not configured, falling back to mock SMS")
    console.log(`[v0] Mock SMS to ${to}: Certificate ${certificateId} for ${candidateName} - ${eventName}`)
    return { success: true, mock: true }
  }

  try {
    const message = await twilioClient.messages.create({
      body: `Congratulations ${candidateName}! Your certificate for "${eventName}" is ready. Certificate ID: ${certificateId}. Verify: ${verificationUrl}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    })

    console.log(`[v0] SMS sent successfully: ${message.sid}`)
    return { success: true, messageId: message.sid }
  } catch (error) {
    console.error("[v0] SMS send error:", error)
    throw error
  }
}

// Legacy function names for backward compatibility
export const sendEmailNotification = sendCertificateNotificationEmail
export const sendSMSNotification = sendCertificateSMS
