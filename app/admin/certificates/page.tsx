"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { CertificateDeliveryDialog } from "@/components/certificate-delivery-dialog"
import { Search, Download, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import type { Certificate } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function CertificatesPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const { data } = useSWR(`/api/admin/certificates?search=${encodeURIComponent(debouncedSearch)}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })
  const certificates: Certificate[] = data?.certificates || []
  const [selectedCertificateIds, setSelectedCertificateIds] = useState<string[]>([])
  const [sortEvent, setSortEvent] = useState("all")

  const eventOptions = useMemo(() => {
    const events = certificates
      .map((cert) => cert.eventName || "Unknown")
      .filter(Boolean)
    return ["all", ...Array.from(new Set(events))]
  }, [certificates])

  const displayedCertificates = useMemo(() => {
    if (sortEvent === "all") return certificates
    return certificates.filter((cert) => cert.eventName === sortEvent)
  }, [certificates, sortEvent])

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(handler)
  }, [search])

  const allSelected = displayedCertificates.length > 0 && selectedCertificateIds.length === displayedCertificates.length

  const toggleCertificate = (id: string) => {
    setSelectedCertificateIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const toggleAllCertificates = () => {
    if (allSelected) {
      setSelectedCertificateIds([])
    } else {
      setSelectedCertificateIds(displayedCertificates.map((cert) => cert._id))
    }
  }

  async function handleBulkDownload() {
    const certificateIds = selectedCertificateIds.length > 0 ? selectedCertificateIds : certificates.map((cert) => cert._id)
    if (certificateIds.length === 0) {
      toast.error("No certificates available to download")
      return
    }

    toast.info("Preparing ZIP download...")
    try {
      const res = await fetch("/api/admin/certificates/download-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateIds }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = selectedCertificateIds.length > 0 ? "certificates_selected.zip" : "certificates_all.zip"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Download started")
    } catch {
      toast.error("Failed to download")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Certificates</h1>
          <p className="text-muted-foreground">View and manage all generated certificates</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button onClick={handleBulkDownload} disabled={certificates.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Download Selected
          </Button>
          {certificates.length > 0 && (
            <CertificateDeliveryDialog
              initialSelectedCertificateIds={selectedCertificateIds}
              disabled={selectedCertificateIds.length === 0}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative max-w-sm w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Event:</label>
          <select
            value={sortEvent}
            onChange={(e) => setSortEvent(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {eventOptions.map((eventName) => (
              <option key={eventName} value={eventName}>
                {eventName === "all" ? "All events" : eventName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Generated Certificates ({certificates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No certificates generated yet</p>
              <p className="text-sm text-muted-foreground">Go to the Generate page to create certificates</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        id="select-all-certificates"
                        checked={allSelected}
                        onCheckedChange={toggleAllCertificates}
                      />
                    </TableHead>
                    <TableHead>Certificate ID</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="hidden md:table-cell">Template</TableHead>
                    <TableHead className="hidden md:table-cell">Issued</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedCertificates.map((cert) => (
                    <TableRow key={cert._id}>
                      <TableCell>
                        <Checkbox
                          id={`cert-${cert._id}`}
                          checked={selectedCertificateIds.includes(cert._id)}
                          onCheckedChange={() => toggleCertificate(cert._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {cert.certificateId}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{cert.candidateName}</TableCell>
                      <TableCell>{cert.eventName}</TableCell>
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
                            aria-label="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(`/verify/${cert.certificateId}`, "_blank")}
                            aria-label="View verification page"
                          >
                            <ExternalLink className="w-4 h-4" />
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
