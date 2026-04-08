"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { Candidate, Template } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function GeneratePage() {
  const { data: candidateData, mutate: mutateCandidates } = useSWR("/api/admin/candidates", fetcher)
  const { data: templateData } = useSWR("/api/admin/templates", fetcher)

  const candidates: Candidate[] = candidateData?.candidates || []
  const templates: Template[] = templateData?.templates || []

  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ count: number; certificates: Array<{ certificateId: string; candidateName: string }> } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  function toggleCandidate(id: string) {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  function getUniqueEvents() {
    const events = new Set<string>()
    candidates.forEach((c) => {
      if (c.eventName) {
        events.add(c.eventName)
      }
    })
    return Array.from(events).sort()
  }

  function getFilteredCandidates() {
    if (!selectedEvent) {
      return candidates
    }
    return candidates.filter((c) => c.eventName === selectedEvent)
  }

  function selectAll() {
    const filteredCandidates = getFilteredCandidates()
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([])
    } else {
      setSelectedCandidates(filteredCandidates.map((c) => c._id))
    }
  }

  const filteredCandidates = getFilteredCandidates()
  const uniqueEvents = getUniqueEvents()

  async function handleGenerate() {
    if (selectedCandidates.length === 0) {
      toast.error("Please select at least one candidate")
      return
    }
    if (!selectedTemplate) {
      toast.error("Please select a template")
      return
    }

    const confirmMsg = `Generate certificates for ${selectedCandidates.length} candidate(s)?`
    if (!confirm(confirmMsg)) return

    setGenerating(true)
    setResult(null)

    try {
      const res = await fetch("/api/admin/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateIds: selectedCandidates,
          templateId: selectedTemplate,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Generation failed")
        setGenerating(false)
        return
      }

      setResult(data)
      toast.success(`${data.count} certificates generated successfully!`)
      setSelectedCandidates([])
      mutateCandidates()
    } catch {
      toast.error("Failed to generate certificates")
    }
    setGenerating(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Generate Certificates</h1>
        <p className="text-muted-foreground">Select candidates and a template to generate certificates</p>
      </div>

      {result && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Successfully generated {result.count} certificates</p>
                <div className="mt-2 flex flex-col gap-1">
                  {result.certificates.map((c) => (
                    <p key={c.certificateId} className="text-sm text-green-700 dark:text-green-300">
                      {c.candidateName} - {c.certificateId}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Select Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center p-0 text-xs">1</Badge>
              Select Template
            </CardTitle>
            <CardDescription>Choose a certificate design</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {templates.map((t) => (
              <button
                key={t._id}
                onClick={() => setSelectedTemplate(t._id)}
                className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  selectedTemplate === t._id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:-translate-y-0.5 hover:border-primary"
                }`}
              >
                <div className="relative h-24 overflow-hidden bg-slate-100">
                  {t.backgroundUrl ? (
                    <img
                      src={t.backgroundUrl}
                      alt={`${t.name} preview`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{ backgroundColor: t.primaryColor || "#e2e8f0" }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                  <div className="absolute left-2 bottom-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                    {t.layoutKey}
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-sm font-semibold text-foreground truncate">{t.name}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground truncate">
                    {t.fontStyle || "Standard style"}
                  </p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Step 2: Select Candidates */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Badge variant="outline" className="w-6 h-6 rounded-full flex items-center justify-center p-0 text-xs">2</Badge>
                  Select Candidates
                </CardTitle>
                <CardDescription className="mt-1">
                  {selectedCandidates.length} of {filteredCandidates.length} selected
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedEvent ? selectedEvent : "all-events"} onValueChange={(value) => {
                  setSelectedEvent(value === "all-events" ? null : value)
                  setSelectedCandidates([])
                }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-events">All Events</SelectItem>
                    {uniqueEvents.map((event) => (
                      <SelectItem key={event} value={event}>
                        {event}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedCandidates.length === filteredCandidates.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {selectedEvent ? "No candidates for this event" : "No pending candidates available"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent ? "Try selecting a different event or add more candidates" : "Add candidates first or check if all have been generated"}
                </p>
              </div>
            ) : (
              <div className="overflow-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <span className="sr-only">Select</span>
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Event</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCandidates.map((c) => (
                      <TableRow key={c._id} className="cursor-pointer" onClick={() => toggleCandidate(c._id)}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCandidates.includes(c._id)}
                            onCheckedChange={() => toggleCandidate(c._id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.eventName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={generating || selectedCandidates.length === 0 || !selectedTemplate}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate {selectedCandidates.length} Certificate{selectedCandidates.length !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
