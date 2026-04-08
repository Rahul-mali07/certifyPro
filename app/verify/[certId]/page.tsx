"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Award, CheckCircle2, XCircle, Download, ArrowLeft, Loader2 } from "lucide-react"

interface VerificationResult {
  verified: boolean
  certificate?: {
    certificateId: string
    candidateName: string
    eventName: string
    issueDate: string
    issuedAt: string
    templateName: string
    qrCodeUrl?: string
    verificationUrl?: string
  }
}

export default function VerifyPage() {
  const { certId } = useParams<{ certId: string }>()
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/verify/${certId}`)
        const data = await res.json()
        setResult(data)
      } catch {
        setResult({ verified: false })
      }
      setLoading(false)
    }
    verify()
  }, [certId])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Award className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-serif font-bold text-foreground">CertifyPro</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verifying certificate...</p>
          </div>
        ) : result?.verified && result.certificate ? (
          <Card className="overflow-hidden">
            <div className="bg-green-50 border-b border-green-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-serif font-bold text-green-900">Certificate Verified</h1>
                  <p className="text-green-700 text-sm">This certificate is authentic and valid</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Certificate ID</p>
                  <Badge variant="outline" className="font-mono w-fit">{result.certificate.certificateId}</Badge>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Recipient</p>
                  <p className="text-foreground font-medium">{result.certificate.candidateName}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Event / Program</p>
                  <p className="text-foreground font-medium">{result.certificate.eventName}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Issue Date</p>
                  <p className="text-foreground font-medium">
                    {new Date(result.certificate.issueDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Template</p>
                  <p className="text-foreground">{result.certificate.templateName}</p>
                </div>
              </div>

              {result.certificate.qrCodeUrl && (
                <div className="my-6 pt-6 border-t">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">QR Code for Re-verification</p>
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <img
                        src={result.certificate.qrCodeUrl}
                        alt="Certificate QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t flex justify-center">
                <Button onClick={() => window.open(`/api/certificates/${certId}/download`, "_blank")}>
                  <Download className="w-4 h-4" />
                  Download Certificate PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="bg-red-50 border-b border-red-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-xl font-serif font-bold text-red-900">Certificate Not Found</h1>
                  <p className="text-red-700 text-sm">
                    No certificate matching ID &quot;{certId}&quot; was found in our records
                  </p>
                </div>
              </div>
            </div>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Please check the certificate ID and try again, or contact the issuing organization.
              </p>
              <Button variant="outline" asChild>
                <Link href="/">Return Home</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
