"use client"
import { Pencil } from "lucide-react";
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TemplateEditor } from "@/components/template-editor"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Template } from "@/lib/types"

export default function TemplateEditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get("id")
  const [template, setTemplate] = useState<Template | null>(null)
  // Only show loading if we have a valid template ID to fetch
  const shouldFetchTemplate = templateId && templateId !== 'undefined' && templateId !== 'null'
  const [loading, setLoading] = useState(!!shouldFetchTemplate)

  useEffect(() => {
    const templateId = searchParams.get("id")
    const safeId = templateId ? String(templateId).trim() : ""

    // If no ID provided, this is a new template creation - no need to fetch
    if (!safeId) {
      setTemplate(null)
      setLoading(false)
      return
    }

    // If invalid ID provided, show error
    if (safeId === 'undefined' || safeId === 'null') {
      console.log("Invalid template ID:", templateId, "safeId:", safeId)
      toast.error("Invalid template ID provided")
      router.push("/admin/templates")
      return
    }

    console.log("Fetching template with safeId:", safeId)

    const fetchTemplate = async () => {
      try {
        const res = await fetch(`/api/admin/templates/${encodeURIComponent(safeId)}`, {
          credentials: "same-origin",
        })
        const data = await res.json()

        if (!res.ok) {
          console.error("Template load failed", res.status, res.statusText, data)
          throw new Error(data?.error || `Failed to fetch template (${res.status})`)
        }

        setTemplate(data.template)
      } catch (error) {
        console.error("Template fetch error:", error)
        toast.error(error instanceof Error ? error.message : "Failed to load template")
        router.push("/admin/templates")
      }
      setLoading(false)
    }

    fetchTemplate()
  }, [searchParams, router])

  const handleSave = async (data: Partial<Template>) => {
    try {
      const safeId = templateId ? encodeURIComponent(String(templateId).trim()) : null
      const url = safeId
        ? `/api/admin/templates/${safeId}`
        : "/api/admin/templates"
      const method = safeId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData?.error || `Failed to save template (${res.status})`)
      }

      toast.success(
        safeId ? "Template updated successfully" : "Template created successfully"
      )
      router.push("/admin/templates")
    } catch (error) {
      console.error("Template save error:", error)
      throw new Error(error instanceof Error ? error.message : "Failed to save template")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/templates">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            {templateId ? "Edit Template" : "Create New Template"}
          </h1>
          <p className="text-muted-foreground">
            {templateId ? "Customize certificate template" : "Design a new certificate template"}
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        <TemplateEditor template={template || undefined} onSave={handleSave} />
      )}
    </div>
  )
}
