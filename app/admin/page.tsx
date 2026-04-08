"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Award, Palette, Activity, Search, QrCode, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { QRScanner } from "@/components/qr-scanner"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function StatCard({ title, value, icon: Icon, description }: {
  title: string
  value: number | string
  icon: React.ElementType
  description: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [verifyId, setVerifyId] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [qrScanError, setQrScanError] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean
    message: string
    certificate?: { candidateName: string; eventName: string; issueDate: string }
  } | null>(null)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!verifyId.trim()) return
    
    setVerifying(true)
    setVerifyResult(null)
    
    try {
      const res = await fetch(`/api/verify/${verifyId.trim()}`)
      const data = await res.json()
      
      if (res.ok && data.certificate) {
        setVerifyResult({
          valid: true,
          message: "Certificate verified successfully",
          certificate: {
            candidateName: data.certificate.candidateName,
            eventName: data.certificate.eventName,
            issueDate: data.certificate.issueDate,
          },
        })
      } else {
        setVerifyResult({
          valid: false,
          message: data.error || "Certificate not found",
        })
      }
    } catch {
      setVerifyResult({
        valid: false,
        message: "Verification failed. Please try again.",
      })
    } finally {
      setVerifying(false)
    }
  }

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
      // Not a valid URL
    }

    const idMatch = trimmed.match(/(CERT-[A-Z0-9]{8})$/i)
    if (idMatch) {
      return idMatch[1].toUpperCase()
    }

    return trimmed
  }

  function handleQrScan(verificationId: string) {
    setShowQrScanner(false)
    const certIdFromQr = normalizeVerificationId(verificationId)
    if (!certIdFromQr) {
      setQrScanError("QR scan did not return a valid certificate ID")
      return
    }
    router.push(`/verify/${certIdFromQr}`)
  }

  const { data, isLoading } = useSWR("/api/admin/stats", fetcher)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your certificate platform</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const stats = data || { totalCandidates: 0, totalCertificates: 0, totalTemplates: 0, recentActivity: [], certificatesByMonth: [] }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your certificate platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Candidates" value={stats.totalCandidates} icon={Users} description="Registered candidates" />
        <StatCard title="Certificates Issued" value={stats.totalCertificates} icon={Award} description="Total certificates generated" />
        <StatCard title="Templates" value={stats.totalTemplates} icon={Palette} description="Available templates" />
        <StatCard title="Recent Actions" value={stats.recentActivity.length} icon={Activity} description="In the last 30 days" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Verify Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Search className="h-5 w-5" />
              Quick Verify
            </CardTitle>
            <CardDescription>Instantly verify certificate authenticity</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="flex gap-2">
              <Input
                placeholder="Enter Certificate ID, Serial No, or Verification ID"
                value={verifyId}
                onChange={(e) => setVerifyId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={verifying || !verifyId.trim()}>
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
              </Button>
            </form>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setShowQrScanner((open) => !open)
                  setQrScanError(null)
                }}
              >
                <QrCode className="w-4 h-4 mr-2" />
                {showQrScanner ? "Hide QR Scanner" : "Scan QR Code"}
              </Button>
              {showQrScanner && (
                <div className="mt-3">
                  <QRScanner
                    onScan={handleQrScan}
                    onError={(message) => setQrScanError(message)}
                  />
                  {qrScanError && (
                    <p className="mt-2 text-sm text-red-600">{qrScanError}</p>
                  )}
                </div>
              )}
            </div>
            
            {verifyResult && (
              <div className={`mt-4 p-4 rounded-lg ${verifyResult.valid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {verifyResult.valid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${verifyResult.valid ? "text-green-700" : "text-red-700"}`}>
                    {verifyResult.message}
                  </span>
                </div>
                {verifyResult.certificate && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><span className="font-medium">Name:</span> {verifyResult.certificate.candidateName}</p>
                    <p><span className="font-medium">Event:</span> {verifyResult.certificate.eventName}</p>
                    <p><span className="font-medium">Issued:</span> {new Date(verifyResult.certificate.issueDate).toLocaleDateString()}</p>
                    <Button 
                      variant="link" 
                      className="px-0 h-auto text-primary"
                      onClick={() => router.push(`/verify/${verifyId.trim()}`)}
                    >
                      View Full Certificate
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {!verifyResult && (
              <p className="mt-4 text-sm text-muted-foreground text-center">
                Enter any certificate identifier to verify its authenticity
              </p>
            )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
            <CardDescription>Latest actions on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="flex flex-col gap-3">
                {stats.recentActivity.slice(0, 8).map((log: { id: number; action: string; user_name: string; created_at: string; details: string }) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium">{log.action}</p>
                      <p className="text-muted-foreground text-xs truncate">
                        {log.user_name} &middot; {new Date(log.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No activity recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
