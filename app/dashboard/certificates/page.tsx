"use client"

import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, ExternalLink, Award } from "lucide-react"
import Link from "next/link"
import type { Certificate } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function UserCertificatesPage() {
  const { data } = useSWR("/api/user/certificates", fetcher)
  const certificates: Certificate[] = data?.certificates || []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">My Certificates</h1>
        <p className="text-muted-foreground">All certificates issued to your account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Certificates ({certificates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No certificates found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your certificates will appear here once generated
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate ID</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="hidden md:table-cell">Template</TableHead>
                    <TableHead className="hidden md:table-cell">Issued</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert._id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{cert.certificateId}</Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{cert.eventName}</TableCell>
                      <TableCell className="hidden md:table-cell">{cert.template_name || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
