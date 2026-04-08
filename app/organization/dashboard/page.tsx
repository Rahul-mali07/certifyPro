"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Building2, Plus, Copy, Trash2, Loader2, LogOut, Key, Users, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import type { AdminCode, Organization } from "@/lib/types"

export default function OrganizationDashboardPage() {
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [codes, setCodes] = useState<AdminCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newCodeDescription, setNewCodeDescription] = useState("")
  const [newCodeMaxUsage, setNewCodeMaxUsage] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchOrganization()
    fetchCodes()
  }, [])

  async function fetchOrganization() {
    try {
      const res = await fetch("/api/organizations/me")
      if (!res.ok) {
        router.push("/organization/login")
        return
      }
      const data = await res.json()
      setOrganization(data.organization)
    } catch {
      router.push("/organization/login")
    }
  }

  async function fetchCodes() {
    try {
      const res = await fetch("/api/organizations/admin-codes")
      if (res.ok) {
        const data = await res.json()
        setCodes(data.codes)
      }
    } catch (error) {
      console.error("Failed to fetch codes:", error)
    } finally {
      setLoading(false)
    }
  }

  async function createCode() {
    setCreating(true)
    try {
      const res = await fetch("/api/organizations/admin-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: newCodeDescription || "Admin access code",
          maxUsage: newCodeMaxUsage ? parseInt(newCodeMaxUsage) : undefined,
        }),
      })

      if (!res.ok) {
        toast.error("Failed to create admin code")
        return
      }

      const data = await res.json()
      setCodes([data.code, ...codes])
      setDialogOpen(false)
      setNewCodeDescription("")
      setNewCodeMaxUsage("")
      toast.success("Admin code created successfully!")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setCreating(false)
    }
  }

  async function toggleCodeStatus(code: AdminCode) {
    try {
      const res = await fetch("/api/organizations/admin-codes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: code._id, isActive: !code.isActive }),
      })

      if (!res.ok) {
        toast.error("Failed to update code")
        return
      }

      setCodes(codes.map((c) => (c._id === code._id ? { ...c, isActive: !c.isActive } : c)))
      toast.success(`Code ${code.isActive ? "deactivated" : "activated"}`)
    } catch {
      toast.error("Something went wrong")
    }
  }

  async function deleteCode(codeId: string) {
    if (!confirm("Are you sure you want to delete this admin code?")) return

    try {
      const res = await fetch(`/api/organizations/admin-codes?id=${codeId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        toast.error("Failed to delete code")
        return
      }

      setCodes(codes.filter((c) => c._id !== codeId))
      toast.success("Admin code deleted")
    } catch {
      toast.error("Something went wrong")
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code)
    setCopied(code)
    toast.success("Code copied to clipboard!")
    setTimeout(() => setCopied(null), 2000)
  }

  async function logout() {
    document.cookie = "org-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    router.push("/organization/login")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalUsage = codes.reduce((sum, c) => sum + c.usageCount, 0)
  const activeCodes = codes.filter((c) => c.isActive).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-foreground">{organization?.name}</h1>
              <p className="text-sm text-muted-foreground">{organization?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Admin Codes</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{codes.length}</div>
              <p className="text-xs text-muted-foreground">{activeCodes} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalUsage}</div>
              <p className="text-xs text-muted-foreground">Admins registered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <p className="text-xs text-muted-foreground">Organization is active</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Codes Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Admin Codes</CardTitle>
              <CardDescription>Manage access codes for admin registration</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Admin Code</DialogTitle>
                  <DialogDescription>
                    Create a new admin code for your organization. Share this code with admins who need access.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      placeholder="e.g., For HR department"
                      value={newCodeDescription}
                      onChange={(e) => setNewCodeDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxUsage">Max Usage (optional)</Label>
                    <Input
                      id="maxUsage"
                      type="number"
                      placeholder="Leave empty for unlimited"
                      value={newCodeMaxUsage}
                      onChange={(e) => setNewCodeMaxUsage(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Set a limit on how many times this code can be used
                    </p>
                  </div>
                  <Button onClick={createCode} disabled={creating} className="w-full">
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Admin Code"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {codes.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Key className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No admin codes yet. Create your first one!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => (
                    <TableRow key={code._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{code.code}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyCode(code.code)}
                          >
                            {copied === code.code ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{code.description || "-"}</TableCell>
                      <TableCell>
                        {code.usageCount}
                        {code.maxUsage ? ` / ${code.maxUsage}` : " (unlimited)"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={code.isActive}
                            onCheckedChange={() => toggleCodeStatus(code)}
                          />
                          <Badge variant={code.isActive ? "default" : "secondary"}>
                            {code.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(code.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteCode(code._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-foreground">How to Use Admin Codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </div>
              <p>Create an admin code using the button above</p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </div>
              <p>Share the code with team members who need admin access</p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                3
              </div>
              <p>They use the code during admin registration at /register</p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                4
              </div>
              <p>Track usage and deactivate codes when needed</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
