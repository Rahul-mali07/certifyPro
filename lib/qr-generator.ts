import QRCode from "qrcode"

export async function generateQRCode(data: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      width: 300,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
    return qrCodeDataUrl
  } catch (error) {
    console.error("[v0] Error generating QR code:", error)
    throw new Error("Failed to generate QR code")
  }
}

export async function generateQRCodeSVG(data: string): Promise<string> {
  try {
    const svg = await QRCode.toString(data, {
      errorCorrectionLevel: "H",
      type: "image/svg+xml",
      quality: 0.95,
      margin: 1,
      width: 300,
    })
    return svg
  } catch (error) {
    console.error("[v0] Error generating QR code SVG:", error)
    throw new Error("Failed to generate QR code")
  }
}

export function getVerificationUrl(verificationId: string, domain?: string): string {
  const baseUrl = domain || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${baseUrl}/verify/${verificationId}`
}
