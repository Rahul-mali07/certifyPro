"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Award, Download, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { Certificate } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function UserDashboard() {
  const [verifyId, setVerifyId] = useState("")
  const router = useRouter()
  const { data } = useSWR("/api/user/certificates", fetcher)
  const certificates: Certificate[] = data?.certificates || []

  const handleVerify = (event: FormEvent) => {
    event.preventDefault()
    if (!verifyId.trim()) return
    router.push(`/verify/${verifyId.trim()}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">My Dashboard</h1>
        <p className="text-muted-foreground">View and download your certificates</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verify Certificate</CardTitle>
          <CardDescription>Use certificate ID or scan QR code from any certificate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleVerify} className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              placeholder="e.g., CERT-A1B2C3D4"
              value={verifyId}
              onChange={(e) => setVerifyId(e.target.value)}
              className="w-full"
            />
            <Button type="submit" className="w-full sm:w-auto">
              Verify
            </Button>
          </form>
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <Button variant="outline" className="w-full" onClick={() => router.push("/verify") }>
              Scan QR Code
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => router.push("/verify") }>
              Open Verify Page
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{certificates.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Certificates issued to you</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Recent Certificates</CardTitle>
          <CardDescription>Your latest certificates</CardDescription>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No certificates yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Certificates will appear here once they are generated for you
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.slice(0, 6).map((cert) => (
                <div key={cert._id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{cert.eventName}</p>
                      <Badge variant="outline" className="font-mono text-[10px] mt-0.5">{cert.certificateId}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(`/api/certificates/${cert.certificateId}/download`, "_blank")}
                      aria-label="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/verify/${cert.certificateId}`} target="_blank" aria-label="Verify">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {certificates.length > 6 && (
            <div className="mt-4 text-center">
              <Button variant="outline" asChild>
                <Link href="/dashboard/certificates">View All Certificates</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
