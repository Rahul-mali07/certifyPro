"use client"

import { Pencil } from "lucide-react";
import useSWR from "swr"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Upload, Download } from "lucide-react"
import { toast } from "sonner"
import type { Template } from "@/lib/types"

const fetcher = (url: string) => fetch(url, { credentials: "same-origin" }).then((r) => r.json())

const isValidFileType = (file: File): { isValid: boolean; type: 'json' | 'image' | 'pdf' | 'unknown' } => {
  const filename = file.name.toLowerCase()
  const fileType = file.type

  if (filename.endsWith('.json')) {
    return { isValid: true, type: 'json' }
  }
  if (filename.endsWith('.pdf')) {
    return { isValid: true, type: 'pdf' }
  }
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].some(ext => filename.endsWith(ext))) {
    return { isValid: true, type: 'image' }
  }

  // Fallback to MIME type
  if (fileType === 'application/json') {
    return { isValid: true, type: 'json' }
  }
  if (fileType === 'application/pdf') {
    return { isValid: true, type: 'pdf' }
  }
  if (fileType.startsWith('image/')) {
    return { isValid: true, type: 'image' }
  }

  return { isValid: false, type: 'unknown' }
}

function TemplatePreview({ template }: { template: Template }) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      {/* Template Preview Container - MEDIUM SIZE */}
      <div 
        className="h-64 relative flex items-center justify-center bg-slate-200 overflow-hidden border-b-2 border-slate-300"
        style={{
          backgroundImage: template.backgroundUrl && !template.backgroundUrl.includes('application/pdf') 
            ? `url('${template.backgroundUrl}')` 
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Fallback for PDF or missing image */}
        {(!template.backgroundUrl || template.backgroundUrl.includes('application/pdf')) && (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 absolute inset-0"></div>
        )}

        {/* Default Badge */}
        {template.isDefault && (
          <Badge className="absolute top-4 right-4 z-20 text-sm" variant="default">
            Default
          </Badge>
        )}
      </div>

      {/* Template Info Section */}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-foreground">{template.name}</CardTitle>
        <CardDescription className="line-clamp-2">{template.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Color Indicators */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: template.primaryColor }} />
              <span className="text-muted-foreground">Primary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: template.accentColor }} />
              <span className="text-muted-foreground">Accent</span>
            </div>
            <Badge variant="outline" className="ml-auto">
              {template.fontStyle}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <Link href={`/admin/templates/edit?id=${encodeURIComponent(String(template._id))}`}>
              <Pencil className="w-4 h-4" />
              Edit Template
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TemplatesPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/templates", fetcher)
  let templates: Template[] = []
  let fetchError = null
  if (error) {
    // Try to show backend error message if available
    if (error.response && error.response.error) {
      fetchError = error.response.error
    } else if (error.message) {
      fetchError = error.message
    } else {
      fetchError = "Failed to load templates."
    }
  } else if (data && Array.isArray(data.templates)) {
    templates = data.templates.filter((t: any) => t._id && String(t._id).trim() && t._id !== 'undefined' && t._id !== 'null')
  }

  const handleImportTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const fileValidation = isValidFileType(file)
      if (!fileValidation.isValid) {
        throw new Error("Invalid file type. Please upload a JSON, PDF, or image file.")
      }

      const isJson = fileValidation.type === 'json'
      const isPdf = fileValidation.type === 'pdf'
      const isImage = fileValidation.type === 'image'

      if (isJson) {
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const importedTemplate = JSON.parse(event.target?.result as string)

            // Validate imported template structure
            if (!importedTemplate.name || !importedTemplate.primaryColor) {
              throw new Error("Invalid template file")
            }

            // Save imported template
            const res = await fetch("/api/admin/templates", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(importedTemplate),
            })

            if (!res.ok) throw new Error()

            toast.success("Template imported successfully")
            mutate() // Refresh the templates list
          } catch (error) {
            toast.error("Failed to import template. Please check the file format.")
          }
        }
        reader.readAsText(file)
      } else if (isPdf || isImage) {
        const reader = new FileReader()
        reader.onload = async (event) => {
          const dataUrl = event.target?.result as string
          if (!dataUrl) {
            toast.error("Failed to read uploaded file")
            return
          }

          const newTemplate = {
            name: file.name.replace(/\.[^/.]+$/, ""),
            description: isPdf ? "Imported PDF template background" : "Imported image template background",
            primaryColor: "#1e3a5f",
            accentColor: "#c8a45a",
            fontStyle: "serif",
            layoutKey: "classic",
            backgroundUrl: dataUrl,
            enabledElements: {
              title: true,
              description: true,
              candidateName: true,
              eventName: true,
              logo: true,
              signature: true,
              date: true,
              qr: true,
              customFields: true,
            },
            elementSizes: {
              title: { fontSize: 48, fontWeight: 'bold' },
              description: { fontSize: 14 },
              candidateName: { fontSize: 40, fontWeight: 'bold' },
              eventName: { fontSize: 24 },
              logo: { width: 100, height: 100 },
              signature: { width: 150, height: 60 },
            },
          }

          // Save imported template
          const res = await fetch("/api/admin/templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTemplate),
          })

          if (!res.ok) throw new Error()

          toast.success(`Template imported from ${isPdf ? 'PDF' : 'image'}`)
          mutate() // Refresh the templates list
        }
        reader.readAsDataURL(file)
      } else {
        throw new Error("Please upload a JSON, PDF, or image file")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import template")
    }

    // Reset file input
    e.target.value = ""
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Certificate Templates</h1>
          <p className="text-muted-foreground">Browse available certificate designs</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="file"
              accept=".json,.pdf,image/*"
              onChange={handleImportTemplate}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="template-import"
            />
            <Button variant="outline" asChild>
              <label htmlFor="template-import" className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </label>
            </Button>
          </div>
          <Button asChild>
            <Link href="/admin/templates/edit">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48" />
              <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
            </Card>
          ))}
        </div>
      ) : fetchError ? (
        <div className="text-red-500 font-semibold text-center py-8">{fetchError}</div>
      ) : templates.length === 0 ? (
        <div className="text-muted-foreground text-center py-8">No templates found. Please import or create a template.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t) => (
            <TemplatePreview key={t._id} template={t} />
          ))}
        </div>
      )}
    </div>
  )
}
