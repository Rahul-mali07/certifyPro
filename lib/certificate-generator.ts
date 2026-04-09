import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import QRCode from "qrcode"

interface CertificateInput {
  candidateName: string
  eventName: string
  issueDate: string
  certificateId: string
  templateLayout: string
  primaryColor: string
  accentColor: string
  fontStyle: string
  verificationUrl: string
  backgroundUrl?: string
  backgroundPosition?: {
    x?: number
    y?: number
    width?: number
    height?: number
  }
  logoUrl?: string
  signatureUrl?: string
  logos?: Array<{
    id: string
    url: string
    position?: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  signatures?: Array<{
    id: string
    url: string
    position?: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  signaturePosition?: {
    x: number
    y: number
    width: number
    height: number
  }
  logoPosition?: {
    x: number
    y: number
    width: number
    height: number
  }
  elementPositions?: {
    title: { x: number; y: number; width: number; height: number }
    description: { x: number; y: number; width: number; height: number }
    candidateName: { x: number; y: number; width: number; height: number }
    eventName: { x: number; y: number; width: number; height: number }
    logo: { x: number; y: number; width: number; height: number }
    signature: { x: number; y: number; width: number; height: number }
  }
  enabledElements?: {
    title?: boolean
    description?: boolean
    candidateName?: boolean
    eventName?: boolean
    logo?: boolean
    signature?: boolean
    date?: boolean
    qr?: boolean
    customFields?: boolean
  }
  elementSizes?: {
    title?: { fontSize: number; fontWeight?: string }
    description?: { fontSize: number }
    candidateName?: { fontSize: number; fontWeight?: string }
    eventName?: { fontSize: number }
    logo?: { width: number; height: number }
    signature?: { width: number; height: number }
    borderThickness?: number
    lineHeight?: number
    cornerSize?: number
  }
  customFields?: Array<{
    id: string
    name: string
    placeholder?: string
    x?: number
    y?: number
    fontSize?: number
  }>
  candidateCustomData?: Record<string, string>
  description?: string
  title?: string
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return rgb(0.1, 0.2, 0.35)
  return rgb(
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  )
}

async function getImageBytes(source: string): Promise<Uint8Array> {
  if (!source || source.trim() === "") {
    console.error("Image source is empty for background image.");
    throw new Error("Image source is empty")
  }

  const trimmedSource = source.trim()
  try {
    if (trimmedSource.startsWith("data:")) {
      const parts = trimmedSource.split(",")
      if (parts.length < 2) {
        throw new Error("Invalid data URL format")
      }
      return Buffer.from(parts[1], "base64")
    }

    console.log("Fetching image from URL:", trimmedSource)
    const response = await fetch(trimmedSource)
    console.log("Image fetch status:", response.status, response.statusText)
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.statusText} (${response.status}) for URL:`, trimmedSource)
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error("getImageBytes error:", error, "source:", source?.substring(0, 100))
    throw error
  }
}

async function embedImage(pdfDoc: PDFDocument, source: string): Promise<any> {
  if (!source || source.trim() === "") {
    console.warn("embedImage: Empty or invalid source")
    return null
  }

  try {
    const bytes = await getImageBytes(source)
    console.log("Image bytes obtained successfully, size:", bytes.length)
    
    if (source.includes("application/pdf") || source.match(/\.pdf($|\?)/i)) {
      console.log("Embedding as PDF")
      const pages = await pdfDoc.embedPdf(bytes)
      return pages[0]
    }
    if (source.includes("image/png") || source.match(/\.png($|\?)/i)) {
      console.log("Embedding as PNG")
      return await pdfDoc.embedPng(bytes)
    }
    if (source.includes("image/jpeg") || source.includes("image/jpg") || source.match(/\.(jpeg|jpg)($|\?)/i)) {
      console.log("Embedding as JPEG")
      return await pdfDoc.embedJpg(bytes)
    }
    if (source.includes("image/webp") || source.match(/\.webp($|\?)/i)) {
      console.log("Embedding WEBP as PNG")
      return await pdfDoc.embedPng(bytes)
    }
    
    // Try JPEG as default fallback
    console.log("Using JPEG fallback")
    return await pdfDoc.embedJpg(bytes)
  } catch (error) {
    console.error("embedImage error:", error instanceof Error ? error.message : error, "source length:", source?.length, "source preview:", source?.substring(0, 100))
    return null
  }
}

function getTextPosition(position: { x: number; y: number } | undefined, width: number, height: number, fontSize: number) {
  if (!position) {
    return { x: width / 2, y: height - 140 }
  }
  // Convert from percentage-based positions to pixel coordinates
  // Position Y is from top, PDF Y is from bottom
  // Add fontSize * 0.25 to vertically center text at the specified position
  return {
    x: (position.x / 100) * width,
    y: height - (position.y / 100) * height + fontSize * 0.15,
  }
}

function drawTextAtPosition(page: any, text: string, font: any, size: number, color: any, position: { x: number; y: number }, align: "left" | "center" | "right" = "center") {
  const textWidth = font.widthOfTextAtSize(text, size)
  let x = position.x
  if (align === "center") {
    x -= textWidth / 2
  } else if (align === "right") {
    x -= textWidth
  }
  page.drawText(text, { x, y: position.y, size, font, color })
}

function getCustomFieldValue(field: { id: string; name: string; placeholder?: string }, candidateData?: Record<string, string>) {
  if (!candidateData) return field.placeholder || ""
  return candidateData[field.name] ?? candidateData[field.id] ?? field.placeholder ?? ""
}

export async function generateCertificatePDF(input: CertificateInput): Promise<{ pdfBytes: Uint8Array; qrCodeData: string }> {

  // Fallbacks for missing template fields
  const fallbackElementSizes = {
    title: { fontSize: 48, fontWeight: 'bold' },
    description: { fontSize: 14 },
    candidateName: { fontSize: 40, fontWeight: 'bold' },
    eventName: { fontSize: 24 },
    logo: { width: 100, height: 100 },
    signature: { width: 150, height: 60 },
    borderThickness: 3,
    lineHeight: 1.5,
    cornerSize: 20,
  }
  const fallbackElementPositions = {
    title: { x: 50, y: 20, width: 80, height: 10 },
    description: { x: 50, y: 35, width: 80, height: 5 },
    candidateName: { x: 50, y: 50, width: 80, height: 8 },
    eventName: { x: 50, y: 65, width: 80, height: 6 },
    logo: { x: 10, y: 10, width: 15, height: 10 },
    signature: { x: 70, y: 80, width: 20, height: 8 },
    qr: { x: 85, y: 85, width: 12, height: 12 },
    certificateId: { x: 50, y: 92, width: 40, height: 3 },
  }
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([842, 595]) // A4 Landscape
  const { width, height } = page.getSize()

  // Ensure enabledElements has defaults
  const enabledElements = {
    title: input.enabledElements?.title !== false,
    description: input.enabledElements?.description !== false,
    candidateName: input.enabledElements?.candidateName !== false,
    eventName: input.enabledElements?.eventName !== false,
    logo: input.enabledElements?.logo !== false,
    signature: input.enabledElements?.signature !== false,
    date: input.enabledElements?.date !== false,
    qr: input.enabledElements?.qr !== false,
    customFields: (input.enabledElements && typeof input.enabledElements.customFields !== 'undefined') ? input.enabledElements.customFields !== false : true,
  }

  // Use fallbacks for elementSizes and elementPositions if missing
  if (!input.elementSizes) input.elementSizes = fallbackElementSizes
  else input.elementSizes = { ...fallbackElementSizes, ...input.elementSizes }
  if (!input.elementPositions) input.elementPositions = fallbackElementPositions
  else input.elementPositions = { ...fallbackElementPositions, ...input.elementPositions }

  // Fallback for logo and background
  if (!input.logoUrl && input.logos && input.logos.length > 0) {
    input.logoUrl = input.logos[0].url
  }
  // Fallback background image (public domain placeholder)
  const fallbackBackgroundUrl = "https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png";
  if (!input.backgroundUrl || typeof input.backgroundUrl !== 'string' || input.backgroundUrl.trim() === "") {
    console.warn("No backgroundUrl provided, using fallback background image.");
    input.backgroundUrl = fallbackBackgroundUrl;
  }

  console.log("Certificate generation started", {
    candidateName: input.candidateName,
    logoUrl: input.logoUrl ? "present" : "absent",
    signatureUrl: input.signatureUrl ? "present" : "absent",
    enabledElements: enabledElements
  })

  const primaryRgb = hexToRgb(input.primaryColor)
  const accentRgb = hexToRgb(input.accentColor)

  const fontSerif = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const fontSerifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic)
  const fontSans = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontSansRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman)

  const headingFont = input.fontStyle === "sans-serif" ? fontSans : fontSerif
  const bodyFont = input.fontStyle === "sans-serif" ? fontSansRegular : fontRegular


  // Preload images in parallel for speed
  let backgroundImage = null;
  let logoImage = null;
  let signatureImage = null;
  let triedFallback = false;
  
  try {
    backgroundImage = input.backgroundUrl ? await embedImage(pdfDoc, input.backgroundUrl) : null;
  } catch (e) {
    console.error("Background image failed to embed:", e, "URL:", input.backgroundUrl);
    if (!triedFallback && input.backgroundUrl !== fallbackBackgroundUrl) {
      triedFallback = true;
      console.warn("Retrying with fallback background image.");
      try {
        backgroundImage = await embedImage(pdfDoc, fallbackBackgroundUrl);
        input.backgroundUrl = fallbackBackgroundUrl;
        console.log("Fallback background image loaded successfully");
      } catch (fallbackErr) {
        console.error("Fallback background image also failed:", fallbackErr);
        console.warn("Continuing without background image display");
        backgroundImage = null;
      }
    } else {
      console.warn("Continuing without background image - too many retries");
      backgroundImage = null;
    }
  }
  
  try {
    logoImage = input.logoUrl ? await embedImage(pdfDoc, input.logoUrl) : null;
  } catch (e) {
    console.error("Logo image failed to embed:", e, "URL:", input.logoUrl);
    console.warn("Continuing without logo image");
    logoImage = null;
  }
  
  try {
    signatureImage = input.signatureUrl ? await embedImage(pdfDoc, input.signatureUrl) : null;
  } catch (e) {
    console.error("Signature image failed to embed:", e, "URL:", input.signatureUrl);
    console.warn("Continuing without signature image");
    signatureImage = null;
  }

  // Validate required text fields
  function safeText(val: string | undefined, fallback: string) {
    return (typeof val === 'string' && val.trim() !== '') ? val : fallback;
  }

  // Draw background image with custom position/size if provided
  if (backgroundImage) {
    // Support custom background position/size via input.backgroundPosition
    const bgPos = input.backgroundPosition || { x: 0, y: 0, width, height };
    try {
      page.drawImage(backgroundImage, {
        x: typeof bgPos.x === 'number' ? bgPos.x : 0,
        y: typeof bgPos.y === 'number' ? bgPos.y : 0,
        width: typeof bgPos.width === 'number' ? bgPos.width : width,
        height: typeof bgPos.height === 'number' ? bgPos.height : height,
      });
    } catch (err) {
      console.error("Failed to draw background image:", err);
    }
  } else {
    console.warn("No background image loaded for certificate PDF. Check backgroundUrl and image accessibility.");
  }

  // Generate QR Code
  const qrCodeDataUrl = await QRCode.toDataURL(input.verificationUrl, {
    width: 100,
    margin: 1,
    color: { dark: "#1B2A4A", light: "#FFFFFF" },
  })

  const qrImageBytes = Buffer.from(qrCodeDataUrl.split(",")[1], "base64")
  const qrImage = await pdfDoc.embedPng(qrImageBytes)

  if (input.templateLayout === "classic") {
    await drawClassicTemplate(page, width, height, input, primaryRgb, accentRgb, headingFont, fontSerifItalic, bodyFont, qrImage)
  } else if (input.templateLayout === "modern") {
    await drawModernTemplate(page, width, height, input, primaryRgb, accentRgb, fontSans, fontSansRegular, qrImage)
  } else {
    await drawAcademicTemplate(page, width, height, input, primaryRgb, accentRgb, headingFont, fontSerifItalic, bodyFont, qrImage)
  }

  try {
    // Draw multiple logos
    if (input.logos && input.logos.length > 0) {
      console.log(`Drawing ${input.logos.length} logos`)
      for (const logo of input.logos) {
        try {
          const logoImg = await embedImage(pdfDoc, logo.url)
          if (!logoImg) {
            console.log(`Logo ${logo.id} embed failed`)
            continue
          }

          let logoX: number, logoY: number, logoWidth: number, logoHeight: number

          if (logo.position) {
            logoX = logo.position.x
            logoY = logo.position.y
            logoWidth = logo.position.width || 100
            logoHeight = logo.position.height || 100
            console.log(`Logo ${logo.id} from custom position: x=${logoX}, y=${logoY}, w=${logoWidth}, h=${logoHeight}`)
          } else {
            // Default position - top left
            logoX = 40
            logoY = height - 140
            logoWidth = input.elementSizes?.logo?.width || 100
            logoHeight = input.elementSizes?.logo?.height || 100
            console.log(`Logo ${logo.id} from defaults: x=${logoX}, y=${logoY}, w=${logoWidth}, h=${logoHeight}`)
          }

          const finalLogoX = Math.max(0, Math.min(width - logoWidth, logoX))
          const finalLogoY = Math.max(0, Math.min(height - logoHeight, logoY))
          const finalLogoWidth = Math.max(10, logoWidth)
          const finalLogoHeight = Math.max(10, logoHeight)
          
          console.log(`Drawing logo ${logo.id} FINAL at (${finalLogoX}, ${finalLogoY}) with size ${finalLogoWidth}x${finalLogoHeight}`)
          page.drawImage(logoImg, {
            x: finalLogoX,
            y: finalLogoY,
            width: finalLogoWidth,
            height: finalLogoHeight,
          })
        } catch (error) {
          console.error(`Error drawing logo ${logo.id}:`, error)
        }
      }
    }

    // Draw multiple signatures
    if (input.signatures && input.signatures.length > 0) {
      console.log(`Drawing ${input.signatures.length} signatures`)
      for (const signature of input.signatures) {
        try {
          const sigImg = await embedImage(pdfDoc, signature.url)
          if (!sigImg) {
            console.log(`Signature ${signature.id} embed failed`)
            continue
          }

          let signatureX: number, signatureY: number, signatureWidth: number, signatureHeight: number

          if (signature.position) {
            signatureX = signature.position.x
            signatureY = signature.position.y
            signatureWidth = signature.position.width || 150
            signatureHeight = signature.position.height || 60
            console.log(`Signature ${signature.id} from custom position: x=${signatureX}, y=${signatureY}, w=${signatureWidth}, h=${signatureHeight}`)
          } else {
            // Default position - bottom right
            signatureX = width - 260
            signatureY = 80
            signatureWidth = input.elementSizes?.signature?.width || 150
            signatureHeight = input.elementSizes?.signature?.height || 60
            console.log(`Signature ${signature.id} from defaults: x=${signatureX}, y=${signatureY}, w=${signatureWidth}, h=${signatureHeight}`)
          }

          const finalSignatureX = Math.max(0, Math.min(width - signatureWidth, signatureX))
          const finalSignatureY = Math.max(0, Math.min(height - signatureHeight, signatureY))
          const finalSignatureWidth = Math.max(10, signatureWidth)
          const finalSignatureHeight = Math.max(10, signatureHeight)
          
          console.log(`Drawing signature ${signature.id} FINAL at (${finalSignatureX}, ${finalSignatureY}) with size ${finalSignatureWidth}x${finalSignatureHeight}`)
          page.drawImage(sigImg, {
            x: finalSignatureX,
            y: finalSignatureY,
            width: finalSignatureWidth,
            height: finalSignatureHeight,
          })
        } catch (error) {
          console.error(`Error drawing signature ${signature.id}:`, error)
        }
      }
    }

    // Fallback: Draw single logo if exists (backwards compatibility)
    if (enabledElements.logo && logoImage) {
      console.log("Drawing single logo (legacy)")
      const elementPos = input.elementPositions?.logo
      let logoX: number, logoY: number, logoWidth: number, logoHeight: number

      if (elementPos) {
        logoX = (elementPos.x / 100) * width
        logoWidth = (elementPos.width / 100) * width
        logoHeight = (elementPos.height / 100) * height
        logoY = height - ((elementPos.y / 100) * height) - logoHeight
        console.log(`Logo from elementPositions: x=${logoX}, y=${logoY}, w=${logoWidth}, h=${logoHeight}`)
      } else if (input.logoPosition) {
        logoX = input.logoPosition.x
        logoY = input.logoPosition.y
        logoWidth = input.logoPosition.width || (input.elementSizes?.logo?.width || 100)
        logoHeight = input.logoPosition.height || (input.elementSizes?.logo?.height || 100)
        console.log(`Logo from logoPosition: x=${logoX}, y=${logoY}, w=${logoWidth}, h=${logoHeight}`)
      } else {
        logoX = 40
        logoY = height - 140
        logoWidth = input.elementSizes?.logo?.width || 100
        logoHeight = input.elementSizes?.logo?.height || 100
        console.log(`Logo from defaults: x=${logoX}, y=${logoY}, w=${logoWidth}, h=${logoHeight}`)
      }

      const finalLogoX = Math.max(0, Math.min(width - logoWidth, logoX))
      const finalLogoY = Math.max(0, Math.min(height - logoHeight, logoY))
      const finalLogoWidth = Math.max(10, logoWidth)
      const finalLogoHeight = Math.max(10, logoHeight)
      
      console.log(`Drawing logo FINAL at (${finalLogoX}, ${finalLogoY}) with size ${finalLogoWidth}x${finalLogoHeight}`)
      page.drawImage(logoImage, {
        x: finalLogoX,
        y: finalLogoY,
        width: finalLogoWidth,
        height: finalLogoHeight,
      })
    } else {
      console.log("Logo not drawn: enabled=", enabledElements.logo, ", logoImage=", !!logoImage)
    }

    // Fallback: Draw single signature if exists (backwards compatibility)
    if (enabledElements.signature && signatureImage) {
      console.log("Drawing single signature (legacy)")
      const elementPos = input.elementPositions?.signature
      let signatureX: number, signatureY: number, signatureWidth: number, signatureHeight: number

      if (elementPos) {
        signatureX = (elementPos.x / 100) * width
        signatureWidth = (elementPos.width / 100) * width
        signatureHeight = (elementPos.height / 100) * height
        signatureY = height - ((elementPos.y / 100) * height) - signatureHeight
        console.log(`Signature from elementPositions: x=${signatureX}, y=${signatureY}, w=${signatureWidth}, h=${signatureHeight}`)
      } else if (input.signaturePosition) {
        signatureX = input.signaturePosition.x
        signatureY = input.signaturePosition.y
        signatureWidth = input.signaturePosition.width || (input.elementSizes?.signature?.width || 150)
        signatureHeight = input.signaturePosition.height || (input.elementSizes?.signature?.height || 60)
        console.log(`Signature from signaturePosition: x=${signatureX}, y=${signatureY}, w=${signatureWidth}, h=${signatureHeight}`)
      } else {
        signatureX = width - 260
        signatureY = 80
        signatureWidth = input.elementSizes?.signature?.width || 150
        signatureHeight = input.elementSizes?.signature?.height || 60
        console.log(`Signature from defaults: x=${signatureX}, y=${signatureY}, w=${signatureWidth}, h=${signatureHeight}`)
      }

      const finalSignatureX = Math.max(0, Math.min(width - signatureWidth, signatureX))
      const finalSignatureY = Math.max(0, Math.min(height - signatureHeight, signatureY))
      const finalSignatureWidth = Math.max(10, signatureWidth)
      const finalSignatureHeight = Math.max(10, signatureHeight)
      
      console.log(`Drawing signature FINAL at (${finalSignatureX}, ${finalSignatureY}) with size ${finalSignatureWidth}x${finalSignatureHeight}`)
      page.drawImage(signatureImage, {
        x: finalSignatureX,
        y: finalSignatureY,
        width: finalSignatureWidth,
        height: finalSignatureHeight,
      })
    } else {
      console.log("Signature not drawn: enabled=", enabledElements.signature, ", signatureImage=", !!signatureImage)
    }
  } catch (error) {
    console.warn("Certificate overlay image failed:", error)
  }

  const pdfBytes = await pdfDoc.save()
  return { pdfBytes: pdfBytes as Uint8Array, qrCodeData: qrCodeDataUrl }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function drawClassicTemplate(page: any, width: number, height: number, input: CertificateInput, primaryRgb: any, accentRgb: any, headingFont: any, italicFont: any, bodyFont: any, qrImage: any) {
  const borderThickness = input.elementSizes?.borderThickness || 3
  const lineHeight = input.elementSizes?.lineHeight || 1.5
  const cornerSize = input.elementSizes?.cornerSize || 20
  const titleFontSize = input.elementSizes?.title?.fontSize || 40
  const candidateNameFontSize = input.elementSizes?.candidateName?.fontSize || 32
  const eventNameFontSize = input.elementSizes?.eventName?.fontSize || 20
  
  // Outer border
  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: primaryRgb, borderWidth: borderThickness })
  // Inner border
  page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderColor: accentRgb, borderWidth: lineHeight })
  // Corner accents
  const corners = [[35, height - 35], [width - 55, height - 35], [35, 35], [width - 55, 35]]
  corners.forEach(([x, y]) => {
    page.drawRectangle({ x, y: y - cornerSize / 2, width: cornerSize, height: cornerSize, color: accentRgb })
  })

  // Header text
  // Only show title if enabled and provided
  if (input.enabledElements?.title !== false && typeof input.title === 'string' && input.title.trim() !== '') {
    const titlePosition = getTextPosition(input.elementPositions?.title, width, height, titleFontSize)
    drawTextAtPosition(page, input.title, headingFont, titleFontSize, primaryRgb, titlePosition)
  }

  // Only show description if enabled and provided
  if (input.enabledElements?.description !== false && typeof input.description === 'string' && input.description.trim() !== '') {
    const descriptionPosition = getTextPosition(input.elementPositions?.description, width, height, input.elementSizes?.description?.fontSize || 16)
    drawTextAtPosition(page, input.description, bodyFont, input.elementSizes?.description?.fontSize || 16, accentRgb, descriptionPosition)

    // Top decorative band
    page.drawRectangle({ x: 22, y: height - 75, width: width - 44, height: 50, color: primaryRgb })

    const orgText = "CERTIFYPRO INSTITUTION"
    const orgWidth = headingFont.widthOfTextAtSize(orgText, 18)
    page.drawText(orgText, { x: (width - orgWidth) / 2, y: height - 55, size: 18, font: headingFont, color: rgb(1, 1, 1) })
  }

  // Candidate name and completion text
  let candidateNamePosition: { x: number; y: number } = { x: width / 2, y: height / 2 };
  if (input.enabledElements?.candidateName !== false && typeof input.candidateName === 'string' && input.candidateName.trim() !== '') {
    candidateNamePosition = getTextPosition(input.elementPositions?.candidateName, width, height, 28)
    drawTextAtPosition(page, input.candidateName, headingFont, 28, primaryRgb, candidateNamePosition)
  }
  // Completion text (optional, only if candidate name is present)
  if (input.enabledElements?.candidateName !== false && typeof input.candidateName === 'string' && input.candidateName.trim() !== '') {
    const completedText = "has successfully completed the requirements for"
    const completedWidth = bodyFont.widthOfTextAtSize(completedText, 12)
    page.drawText(completedText, { x: (width - completedWidth) / 2, y: candidateNamePosition.y - 40, size: 12, font: bodyFont, color: primaryRgb })
  }

  // Certificate ID - Fixed at bottom
  const idText = `Certificate ID: ${input.certificateId}`
  const idWidth = bodyFont.widthOfTextAtSize(idText, 9)
  page.drawText(idText, { x: (width - idWidth) / 2, y: 35, size: 9, font: bodyFont, color: primaryRgb })

  // QR Code - Fixed position
  if (input.enabledElements?.qr !== false) {
    const qrDims = qrImage.scale(0.65)
    page.drawImage(qrImage, { x: width - 115, y: 25, width: qrDims.width, height: qrDims.height })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function drawModernTemplate(page: any, width: number, height: number, input: CertificateInput, primaryRgb: any, accentRgb: any, headingFont: any, bodyFont: any, qrImage: any) {
  const lineHeight = input.elementSizes?.lineHeight || 4
  const titleFontSize = input.elementSizes?.title?.fontSize || 24
  const candidateNameFontSize = input.elementSizes?.candidateName?.fontSize || 36
  
  // Left accent bar
  page.drawRectangle({ x: 0, y: 0, width: 8, height, color: accentRgb })

  // Top accent line
  page.drawRectangle({ x: 0, y: height - lineHeight, width, height: lineHeight, color: primaryRgb })

  // Header background
  page.drawRectangle({ x: 40, y: height - 130, width: width - 80, height: 80, color: primaryRgb })

  if (input.enabledElements?.title !== false) {
    const titleText = input.title || "CERTIFICATE OF ACHIEVEMENT"
    const titlePosition = getTextPosition(input.elementPositions?.title, width, height, titleFontSize)
    drawTextAtPosition(page, titleText, headingFont, titleFontSize, rgb(1, 1, 1), titlePosition)
  }

  // Candidate name
  if (input.enabledElements?.candidateName !== false) {
    const candidateNamePosition = getTextPosition(input.elementPositions?.candidateName, width, height, candidateNameFontSize)
    drawTextAtPosition(page, input.candidateName, headingFont, candidateNameFontSize, primaryRgb, candidateNamePosition)

    // Accent line under name
    page.drawRectangle({ x: candidateNamePosition.x - 60, y: candidateNamePosition.y - 15, width: 120, height: 3, color: accentRgb })
  }

  // Body text - just show event name
  let yPos = height - 270
  if (input.enabledElements?.eventName !== false) {
    const font = headingFont
    const size = 18
    const lineWidth = font.widthOfTextAtSize(input.eventName, size)
    page.drawText(input.eventName, { x: (width - lineWidth) / 2, y: yPos, size, font, color: primaryRgb })
    yPos -= 35
  }

  if (input.enabledElements?.customFields !== false && input.customFields && input.customFields.length > 0) {
    input.customFields.forEach((field) => {
      const fieldValue = getCustomFieldValue(field, input.candidateCustomData)
      if (!fieldValue) return
      const fieldSize = field.fontSize || 14
      const safeField = {
        x: typeof field.x === 'number' ? field.x : 50,
        y: typeof field.y === 'number' ? field.y : 80,
      }
      const position = getTextPosition(safeField, width, height, fieldSize)
      drawTextAtPosition(page, `${field.name}: ${fieldValue}`, bodyFont, fieldSize, primaryRgb, position, "left")
    })
  }

  // Certificate ID - Fixed at bottom
  const idText = `Certificate ID: ${input.certificateId}`
  const idWidth = bodyFont.widthOfTextAtSize(idText, 9)
  page.drawText(idText, { x: (width - idWidth) / 2, y: 35, size: 9, font: bodyFont, color: primaryRgb })

  // QR Code - Fixed position at bottom right
  if (input.enabledElements?.qr !== false) {
    const qrDims = qrImage.scale(0.65)
    page.drawImage(qrImage, { x: width - 115, y: 25, width: qrDims.width, height: qrDims.height })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function drawAcademicTemplate(page: any, width: number, height: number, input: CertificateInput, primaryRgb: any, accentRgb: any, headingFont: any, italicFont: any, bodyFont: any, qrImage: any) {
    // Always define candidateNamePosition for use in completion text and event name
    let candidateNamePosition = { x: width / 2, y: height / 2 };
  // Double border
  page.drawRectangle({ x: 15, y: 15, width: width - 30, height: height - 30, borderColor: primaryRgb, borderWidth: 2.5 })
  page.drawRectangle({ x: 22, y: 22, width: width - 44, height: height - 44, borderColor: primaryRgb, borderWidth: 0.8 })

  // Top decorative band
  page.drawRectangle({ x: 22, y: height - 75, width: width - 44, height: 50, color: primaryRgb })

  const orgText = "CERTIFYPRO INSTITUTION"
  const orgWidth = headingFont.widthOfTextAtSize(orgText, 18)
  page.drawText(orgText, { x: (width - orgWidth) / 2, y: height - 58, size: 18, font: headingFont, color: rgb(1, 1, 1) })

  // Certificate title
  if (input.enabledElements?.title !== false) {
    const titleText = input.title || "Certificate of Achievement"
    const titlePosition = getTextPosition(input.elementPositions?.title, width, height, 34)
    drawTextAtPosition(page, titleText, italicFont, 34, primaryRgb, titlePosition)
  }

  // Decorative lines
  page.drawLine({ start: { x: width / 2 - 120, y: height - 148 }, end: { x: width / 2 + 120, y: height - 148 }, thickness: 1, color: accentRgb })

  if (input.enabledElements?.description !== false) {
    const presentedText = input.description || "This is to certify that"
    const descriptionPosition = getTextPosition(input.elementPositions?.description, width, height, 13)
    drawTextAtPosition(page, presentedText, bodyFont, 13, primaryRgb, descriptionPosition)
  }

  // Name
  if (input.enabledElements?.candidateName !== false) {
    candidateNamePosition = getTextPosition(input.elementPositions?.candidateName, width, height, 30)
    drawTextAtPosition(page, input.candidateName, headingFont, 30, primaryRgb, candidateNamePosition)
    page.drawLine({ start: { x: candidateNamePosition.x - 140, y: candidateNamePosition.y - 10 }, end: { x: candidateNamePosition.x + 140, y: candidateNamePosition.y - 10 }, thickness: 1.5, color: accentRgb })
  }

  if (input.enabledElements?.eventName !== false) {
    const completedText = "has successfully completed the requirements for"
    const completedWidth = bodyFont.widthOfTextAtSize(completedText, 12)
    page.drawText(completedText, { x: (width - completedWidth) / 2, y: candidateNamePosition.y - 40, size: 12, font: bodyFont, color: primaryRgb })

    const eventNamePosition = getTextPosition(input.elementPositions?.eventName, width, height, 20)
    drawTextAtPosition(page, input.eventName, italicFont, 20, primaryRgb, eventNamePosition)
  }

  if (input.enabledElements?.customFields !== false && input.customFields && input.customFields.length > 0) {
    input.customFields.forEach((field) => {
      const fieldValue = getCustomFieldValue(field, input.candidateCustomData)
      if (!fieldValue) return
      const fieldSize = field.fontSize || 14
      const safeField = {
        x: typeof field.x === 'number' ? field.x : 50,
        y: typeof field.y === 'number' ? field.y : 80,
      }
      const position = getTextPosition(safeField, width, height, fieldSize)
      drawTextAtPosition(page, `${field.name}: ${fieldValue}`, bodyFont, fieldSize, primaryRgb, position, "left")
    })
  }

  // Certificate ID - Fixed at bottom
  const idText = `Certificate ID: ${input.certificateId}`
  const idWidth = bodyFont.widthOfTextAtSize(idText, 8)
  page.drawText(idText, { x: (width - idWidth) / 2, y: 30, size: 8, font: bodyFont, color: primaryRgb })

  // QR Code - Fixed at bottom right
  if (input.enabledElements?.qr !== false) {
    const qrDims = qrImage.scale(0.6)
    page.drawImage(qrImage, { x: width - 105, y: 20, width: qrDims.width, height: qrDims.height })
  }
}
