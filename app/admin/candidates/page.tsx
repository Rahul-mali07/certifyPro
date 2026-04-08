"use client"

import { useState, useRef } from "react"
import useSWR from "swr"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Upload, Search, MoreHorizontal, Pencil, Trash2, Loader2, Download } from "lucide-react"
import { toast } from "sonner"
import type { Candidate } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function CandidatesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [csvOpen, setCsvOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const queryParams = new URLSearchParams()
  if (search) queryParams.set("search", search)
  if (statusFilter && statusFilter !== "all") queryParams.set("status", statusFilter)

  const { data, mutate } = useSWR(`/api/admin/candidates?${queryParams}`, fetcher)
  const candidates: Candidate[] = data?.candidates || []

  const [form, setForm] = useState({ name: "", email: "", mobile: "", event_name: "" })
  const [csvPreview, setCsvPreview] = useState<Array<Record<string, string>>>([])

  function resetForm() {
    setForm({ name: "", email: "", mobile: "", event_name: "" })
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/admin/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Candidate added successfully")
      resetForm()
      setAddOpen(false)
      mutate()
    } catch {
      toast.error("Failed to add candidate")
    }
    setLoading(false)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCandidate) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/candidates/${selectedCandidate._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Candidate updated")
      setEditOpen(false)
      mutate()
    } catch {
      toast.error("Failed to update candidate")
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this candidate?")) return
    try {
      const res = await fetch(`/api/admin/candidates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Candidate deleted")
      mutate()
    } catch {
      toast.error("Failed to delete candidate")
    }
  }

  function handleCSVFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvPreview(results.data as Array<Record<string, string>>)
      },
      error: () => toast.error("Failed to parse CSV file"),
    })
  }

  async function handleCSVUpload() {
    if (csvPreview.length === 0) return
    setLoading(true)
    try {
      const mapped = csvPreview.map((row) => {
        const name = row.name || row.Name || ""
        const email = row.email || row.Email || ""
        const mobile = row.mobile || row.Mobile || row.phone || row.Phone || ""
        const event_name = row.event_name || row.event || row.Event || row["Event Name"] || ""
        const customData = Object.fromEntries(
          Object.entries(row).filter(
            ([key]) => ![
              "name",
              "Name",
              "email",
              "Email",
              "mobile",
              "Mobile",
              "phone",
              "Phone",
              "event_name",
              "Event_name",
              "event",
              "Event",
              "Event Name",
              "event name",
            ].includes(key)
          )
        ) as Record<string, string>

        return {
          name,
          email,
          mobile,
          event_name,
          customData,
        }
      }).filter(r => r.name && r.email && r.event_name)

      const res = await fetch("/api/admin/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapped),
      })
      const data = await res.json()
      if (!res.ok) throw new Error()
      toast.success(`${data.count} candidates imported successfully`)
      setCsvPreview([])
      setCsvOpen(false)
      mutate()
    } catch {
      toast.error("Failed to import candidates")
    }
    setLoading(false)
  }

  function downloadSampleCSV() {
    const csv = "name,email,mobile,event_name\nJohn Doe,john@example.com,+1234567890,Web Development Workshop\nJane Smith,jane@example.com,+0987654321,Web Development Workshop"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "candidates_sample.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Candidates</h1>
          <p className="text-muted-foreground">Manage event candidates and participants</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4" />
                CSV Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Candidates from CSV</DialogTitle>
                <DialogDescription>Upload a CSV file with columns: name, email, mobile, event_name</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Input type="file" accept=".csv" ref={fileRef} onChange={handleCSVFile} />
                  <Button variant="ghost" size="sm" onClick={downloadSampleCSV}>
                    <Download className="w-4 h-4" />
                    Sample
                  </Button>
                </div>
                {csvPreview.length > 0 && (
                  <div className="border rounded-lg overflow-auto max-h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Event</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvPreview.slice(0, 10).map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>{row.name || row.Name}</TableCell>
                            <TableCell>{row.email || row.Email}</TableCell>
                            <TableCell>{row.event_name || row.event || row.Event || row["Event Name"]}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {csvPreview.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center p-2">
                        ...and {csvPreview.length - 10} more rows
                      </p>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setCsvOpen(false); setCsvPreview([]) }}>Cancel</Button>
                <Button onClick={handleCSVUpload} disabled={csvPreview.length === 0 || loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Import {csvPreview.length} Candidates
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetForm() }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4" />
                Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Candidate</DialogTitle>
                <DialogDescription>Enter the candidate details below</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Full Name</Label>
                  <Input placeholder="John Doe" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Email</Label>
                  <Input type="email" placeholder="john@example.com" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Mobile (optional)</Label>
                  <Input type="tel" placeholder="+1 234 567 890" value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Event Name</Label>
                  <Input placeholder="Web Development Workshop" value={form.event_name} onChange={(e) => setForm({...form, event_name: e.target.value})} required />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Add Candidate
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="generated">Generated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Candidate List ({candidates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-2">No candidates found</p>
              <p className="text-sm text-muted-foreground">Add candidates individually or import them via CSV</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Mobile</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-center">Certificates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.mobile || "-"}</TableCell>
                      <TableCell>{c.eventName}</TableCell>
                      <TableCell className="text-center font-medium text-primary">{c.certificateCount || 0}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "generated" ? "default" : "secondary"}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedCandidate(c)
                              setForm({ name: c.name, email: c.email, mobile: c.mobile || "", event_name: c.eventName })
                              setEditOpen(true)
                            }}>
                              <Pencil className="w-4 h-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(c._id)} className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setSelectedCandidate(null); resetForm() } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
            <DialogDescription>Update the candidate details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Mobile</Label>
              <Input type="tel" value={form.mobile} onChange={(e) => setForm({...form, mobile: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Event Name</Label>
              <Input value={form.event_name} onChange={(e) => setForm({...form, event_name: e.target.value})} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
