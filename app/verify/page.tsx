"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QRScanner } from "@/components/qr-scanner"
import { Award, Search, ArrowLeft, QrCode } from "lucide-react"

export default function VerifySearchPage() {
  const router = useRouter()
  const [certId, setCertId] = useState("")

  function normalizeVerificationId(value: string) {
    const trimmed = value.trim()
    try {
      const url = new URL(trimmed, window.location.origin)
      const segments = url.pathname.split("/").filter(Boolean)
      const verifyIndex = segments.indexOf("verify")
      if (verifyIndex !== -1 && segments.length > verifyIndex + 1) {
        return segments[verifyIndex + 1]
      }
    } catch {
      // not a valid URL
    }

    const idMatch = trimmed.match(/(CERT-[A-Z0-9]{8})$/i)
    if (idMatch) {
      return idMatch[1].toUpperCase()
    }

    return trimmed
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (certId.trim()) {
      router.push(`/verify/${certId.trim()}`)
    }
  }

  function handleQRScan(verificationId: string) {
    const certIdFromQr = normalizeVerificationId(verificationId)
    router.push(`/verify/${certIdFromQr}`)
  }

  return (
    <div className="min-h-screen bg-background">
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

      <main className="max-w-lg mx-auto p-6 mt-16">
        <Card>
          <CardHeader className="text-center">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-serif text-foreground">Verify Certificate</CardTitle>
            <CardDescription>Check certificate authenticity using ID or QR code</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="search" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  <span className="hidden sm:inline">QR Code</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="space-y-4">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <Input
                    placeholder="e.g., CERT-A1B2C3D4"
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    className="text-center"
                  />
                  <Button type="submit" disabled={!certId.trim()}>
                    <Search className="w-4 h-4" />
                    Verify
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="qr" className="space-y-4">
                <QRScanner onScan={handleQRScan} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
