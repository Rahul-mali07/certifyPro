"use client"

import { useState, useEffect, useRef } from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ColorPicker } from "@/components/color-picker"
import { Plus, X, Loader2, Upload, Download, FileText, Palette, Image, Type } from "lucide-react"
import { toast } from "sonner"
import type { Template } from "@/lib/types"

interface TemplateEditorProps {
  template?: Template
  onSave?: (template: Partial<Template>) => Promise<void>
}

export function TemplateEditor({ template, onSave }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || "")
  const [description, setDescription] = useState(template?.description || "")
  const [primaryColor, setPrimaryColor] = useState(template?.primaryColor || "#1e3a5f")
  const [accentColor, setAccentColor] = useState(template?.accentColor || "#c8a45a")
  const [fontStyle, setFontStyle] = useState(template?.fontStyle || "serif")
  const [signatureUrl, setSignatureUrl] = useState(template?.signatureUrl || "")
  const [logoUrl, setLogoUrl] = useState(template?.logoUrl || "")
  const [backgroundUrl, setBackgroundUrl] = useState(template?.backgroundUrl || "")
  const [logos, setLogos] = useState<Array<{id: string; url: string; position?: {x: number; y: number; width: number; height: number}}>>((template as any)?.logos || [])
  const [signatures, setSignatures] = useState<Array<{id: string; url: string; position?: {x: number; y: number; width: number; height: number}}>>((template as any)?.signatures || [])
  const [signatureX, setSignatureX] = useState(template?.signaturePosition?.x ?? 600)
  const [signatureY, setSignatureY] = useState(template?.signaturePosition?.y ?? 100)
  const [signatureWidth, setSignatureWidth] = useState(template?.signaturePosition?.width ?? 150)
  const [signatureHeight, setSignatureHeight] = useState(template?.signaturePosition?.height ?? 80)
  const [logoX, setLogoX] = useState(template?.logoPosition?.x ?? 50)
  const [logoY, setLogoY] = useState(template?.logoPosition?.y ?? 50)
  const [logoWidth, setLogoWidth] = useState(template?.logoPosition?.width ?? 100)
  const [logoHeight, setLogoHeight] = useState(template?.logoPosition?.height ?? 100)
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const signatureInputRef = useRef<HTMLInputElement | null>(null)
  const [layoutKey, setLayoutKey] = useState(template?.layoutKey || "classic")
  const [customFields, setCustomFields] = useState<Array<{ id: string; name: string; placeholder: string; x?: number; y?: number; fontSize?: number }>>(
    template?.customFields || []
  )

  const openLogoInput = () => logoInputRef.current?.click()
  const openSignatureInput = () => signatureInputRef.current?.click()
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("")
  const [loading, setLoading] = useState(false)

  // Element visibility state
  const [enabledElements, setEnabledElements] = useState<Record<string, boolean>>(
    template?.enabledElements || {
      title: true,
      description: true,
      candidateName: true,
      eventName: true,
      logo: true,
      signature: true,
      date: true,
      qr: true,
      customFields: true,
    }
  )

  // Element sizes state
  const [elementSizes, setElementSizes] = useState<Record<string, any>>(
    template?.elementSizes || {
      title: { fontSize: 48, fontWeight: 'bold' },
      description: { fontSize: 14 },
      candidateName: { fontSize: 40, fontWeight: 'bold' },
      eventName: { fontSize: 24 },
      logo: { width: 100, height: 100 },
      signature: { width: 150, height: 60 },
    }
  )

  // Drag and drop state
  const [draggedElement, setDraggedElement] = useState<string | null>(null)
  const [resizingElement, setResizingElement] = useState<{
    element: string
    corner: string
    startMouseX: number
    startMouseY: number
    startScaledX: number
    startScaledY: number
    startPosition: { x: number; y: number; width: number; height: number }
    startFontSize?: number
  } | null>(null)
  const [previewContainerRef, setPreviewContainerRef] = useState<HTMLDivElement | null>(null)
  const [elementPositions, setElementPositions] = useState({
    title: { x: 50, y: 20, width: 80, height: 10 },
    description: { x: 50, y: 35, width: 80, height: 5 },
    candidateName: { x: 50, y: 50, width: 80, height: 8 },
    eventName: { x: 50, y: 65, width: 80, height: 6 },
    logo: { x: 10, y: 75, width: 15, height: 15 },
    signature: { x: 70, y: 75, width: 20, height: 15 },
    qr: { x: 85, y: 85, width: 12, height: 12 },
    certificateId: { x: 50, y: 92, width: 40, height: 3 },
  })

  // Load element positions from template if available
  useEffect(() => {
    const defaultPositions = {
      title: { x: 50, y: 20, width: 80, height: 10 },
      description: { x: 50, y: 35, width: 80, height: 5 },
      candidateName: { x: 50, y: 50, width: 80, height: 8 },
      eventName: { x: 50, y: 65, width: 80, height: 6 },
      logo: { x: 10, y: 10, width: 15, height: 10 },
      signature: { x: 70, y: 80, width: 20, height: 8 },
      qr: { x: 85, y: 85, width: 12, height: 12 },
      certificateId: { x: 50, y: 92, width: 40, height: 3 },
    }
    
    if (template?.elementPositions) {
      // Merge template positions with defaults to ensure all properties exist
      setElementPositions({
        ...defaultPositions,
        ...template.elementPositions,
      })
    } else {
      setElementPositions(defaultPositions)
    }
  }, [template])

  // Update all state when template changes
  useEffect(() => {
    if (template) {
      setName(template.name || "")
      setDescription(template.description || "")
      setPrimaryColor(template.primaryColor || "#1e3a5f")
      setAccentColor(template.accentColor || "#c8a45a")
      setFontStyle(template.fontStyle || "serif")
      setSignatureUrl(template.signatureUrl || "")
      setLogoUrl(template.logoUrl || "")
      setBackgroundUrl(template.backgroundUrl || "")
      setLayoutKey(template.layoutKey || "classic")
      setCustomFields(template.customFields || [])
      // Load multiple signatures and logos arrays
      setSignatures((template as any).signatures || [])
      setLogos((template as any).logos || [])
      setEnabledElements(template.enabledElements || {
        title: true,
        description: true,
        candidateName: true,
        eventName: true,
        logo: true,
        signature: true,
        date: true,
        qr: true,
        customFields: true,
      })
      setElementSizes(template.elementSizes || {
        title: { fontSize: 48, fontWeight: 'bold' },
        description: { fontSize: 14 },
        candidateName: { fontSize: 40, fontWeight: 'bold' },
        eventName: { fontSize: 24 },
        logo: { width: 100, height: 100 },
        signature: { width: 150, height: 60 },
      })
      // elementPositions will be handled by the dedicated useEffect above
    }
  }, [template])

  // Sync elementPositions with elementSizes when preview container is available
  useEffect(() => {
    if (previewContainerRef && (elementSizes.logo?.width || elementSizes.signature?.width)) {
      const rect = previewContainerRef.getBoundingClientRect()
      const containerWidth = rect.width
      const containerHeight = rect.height

      setElementPositions(prev => ({
        ...prev,
        logo: {
          ...prev.logo,
          width: Math.max(5, Math.min(50, (elementSizes.logo?.width || 100) / containerWidth * 100)),
          height: Math.max(3, Math.min(30, (elementSizes.logo?.height || 100) / containerHeight * 100))
        },
        signature: {
          ...prev.signature,
          width: Math.max(5, Math.min(50, (elementSizes.signature?.width || 150) / containerWidth * 100)),
          height: Math.max(3, Math.min(30, (elementSizes.signature?.height || 60) / containerHeight * 100))
        }
      }))
    }
  }, [elementSizes, previewContainerRef])

  // Drag handlers
  const handleDragStart = (elementId: string) => {
    setDraggedElement(elementId)
  }

  const handleDragEnd = () => {
    setDraggedElement(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedElement) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const clampedX = Math.max(0, Math.min(90, x))
    const clampedY = Math.max(0, Math.min(90, y))

    if (draggedElement.startsWith('custom-')) {
      const fieldId = draggedElement.replace('custom-', '')
      setCustomFields(prev => prev.map(field => field.id === fieldId ? { ...field, x: clampedX, y: clampedY } : field))
      return
    }

    if (draggedElement.startsWith('logo-')) {
      const logoId = draggedElement.replace('logo-', '')
      setLogos(prev => prev.map(logo =>
        logo.id === logoId
          ? {
              ...logo,
              position: {
                ...logo.position,
                x: clampedX * 8.42, // Convert to PDF coordinates
                y: (100 - clampedY) * 5.95 - (logo.position?.height || 100),
                width: logo.position?.width || 100,
                height: logo.position?.height || 100
              }
            }
          : logo
      ))
      return
    }

    if (draggedElement.startsWith('signature-')) {
      const sigId = draggedElement.replace('signature-', '')
      setSignatures(prev => prev.map(sig =>
        sig.id === sigId
          ? {
              ...sig,
              position: {
                ...sig.position,
                x: clampedX * 8.42, // Convert to PDF coordinates
                y: (100 - clampedY) * 5.95 - (sig.position?.height || 60),
                width: sig.position?.width || 150,
                height: sig.position?.height || 60
              }
            }
          : sig
      ))
      return
    }

    setElementPositions(prev => ({
      ...prev,
      [draggedElement]: {
        ...prev[draggedElement],
        x: clampedX,
        y: clampedY
      }
    }))

    // Update specific position states
    if (draggedElement === 'logo') {
      setLogoX(clampedX * 8.42) // Convert to PDF coordinates
      setLogoY((100 - clampedY) * 5.95)
    } else if (draggedElement === 'signature') {
      setSignatureX(clampedX * 8.42)
      setSignatureY((100 - clampedY) * 5.95)
    }
  }

  const handleResizeStart = (e: React.MouseEvent, element: string, corner: string) => {
    e.preventDefault()
    e.stopPropagation()

    const rect = previewContainerRef?.getBoundingClientRect()
    const startScaledX = rect ? ((e.clientX - rect.left) / rect.width) * 100 : 0
    const startScaledY = rect ? ((e.clientY - rect.top) / rect.height) * 100 : 0

    let startPosition = { x: 0, y: 0, width: 10, height: 10 }
    let startFontSize: number | undefined

    if (element.startsWith('logo-')) {
      const logoId = element.replace('logo-', '')
      const logo = logos.find(l => l.id === logoId)
      if (logo?.position) {
        const pdfPos = logo.position
        startPosition = {
          x: (pdfPos.x / 842) * 100,
          y: 100 - ((pdfPos.y + pdfPos.height) / 595) * 100,
          width: (pdfPos.width / 842) * 100,
          height: (pdfPos.height / 595) * 100
        }
      }
    } else if (element.startsWith('signature-')) {
      const sigId = element.replace('signature-', '')
      const sig = signatures.find(s => s.id === sigId)
      if (sig?.position) {
        const pdfPos = sig.position
        startPosition = {
          x: (pdfPos.x / 842) * 100,
          y: 100 - ((pdfPos.y + pdfPos.height) / 595) * 100,
          width: (pdfPos.width / 842) * 100,
          height: (pdfPos.height / 595) * 100
        }
      }
    } else {
      startPosition = elementPositions[element as keyof typeof elementPositions] || { x: 0, y: 0, width: 10, height: 10 }
      startFontSize = elementSizes[element as keyof typeof elementSizes]?.fontSize
    }

    setResizingElement({
      element,
      corner,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startScaledX,
      startScaledY,
      startPosition: { ...startPosition },
      startFontSize,
    })
  }

  useEffect(() => {
    if (!resizingElement || !previewContainerRef) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = previewContainerRef.getBoundingClientRect()
      const currentX = ((e.clientX - rect.left) / rect.width) * 100
      const currentY = ((e.clientY - rect.top) / rect.height) * 100
      const deltaX = currentX - resizingElement.startScaledX
      const deltaY = currentY - resizingElement.startScaledY
      const startPosition = resizingElement.startPosition
      const corner = resizingElement.corner
      const isTextElement = ['title', 'description', 'candidateName', 'eventName'].includes(resizingElement.element)

      if (isTextElement) {
        const startFontSize = resizingElement.startFontSize || 24
        const scaleDelta = (deltaX + deltaY) / 2
        const newFontSize = Math.round(Math.max(8, Math.min(96, startFontSize + scaleDelta * 0.6)))

        setElementSizes(prev => ({
          ...prev,
          [resizingElement.element]: {
            ...prev[resizingElement.element],
            fontSize: newFontSize,
          }
        }))
      } else {
        let newWidth = startPosition.width
        let newHeight = startPosition.height
        let newX = startPosition.x
        let newY = startPosition.y

        if (corner.includes('se')) {
          newWidth = Math.max(5, Math.min(85, startPosition.width + deltaX))
          newHeight = Math.max(3, Math.min(95, startPosition.height + deltaY))
        } else if (corner.includes('sw')) {
          newWidth = Math.max(5, Math.min(85, startPosition.width - deltaX))
          newHeight = Math.max(3, Math.min(95, startPosition.height + deltaY))
          newX = Math.max(0, Math.min(100, startPosition.x + deltaX))
        } else if (corner.includes('ne')) {
          newWidth = Math.max(5, Math.min(85, startPosition.width + deltaX))
          newHeight = Math.max(3, Math.min(95, startPosition.height - deltaY))
          newY = Math.max(0, Math.min(100, startPosition.y + deltaY))
        } else if (corner.includes('nw')) {
          newWidth = Math.max(5, Math.min(85, startPosition.width - deltaX))
          newHeight = Math.max(3, Math.min(95, startPosition.height - deltaY))
          newX = Math.max(0, Math.min(100, startPosition.x + deltaX))
          newY = Math.max(0, Math.min(100, startPosition.y + deltaY))
        }

        if (resizingElement.element.startsWith('logo-')) {
          const logoId = resizingElement.element.replace('logo-', '')
          setLogos(prev => prev.map(logo =>
            logo.id === logoId
              ? {
                  ...logo,
                  position: {
                    x: newX * 8.42,
                    y: (100 - newY - newHeight) * 5.95,
                    width: newWidth * 8.42,
                    height: newHeight * 5.95
                  }
                }
              : logo
          ))
        } else if (resizingElement.element.startsWith('signature-')) {
          const sigId = resizingElement.element.replace('signature-', '')
          setSignatures(prev => prev.map(sig =>
            sig.id === sigId
              ? {
                  ...sig,
                  position: {
                    x: newX * 8.42,
                    y: (100 - newY - newHeight) * 5.95,
                    width: newWidth * 8.42,
                    height: newHeight * 5.95
                  }
                }
              : sig
          ))
        } else {
          setElementPositions(prev => ({
            ...prev,
            [resizingElement.element]: {
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight,
            }
          }))

          const widthInPixels = (newWidth / 100) * rect.width
          const heightInPixels = (newHeight / 100) * rect.height

          setElementSizes(prev => ({
            ...prev,
            [resizingElement.element]: {
              ...prev[resizingElement.element],
              width: Math.round(Math.max(20, widthInPixels)),
              height: Math.round(Math.max(20, heightInPixels)),
            }
          }))
        }
      }
    }

    const handleMouseUp = () => {
      setResizingElement(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingElement, previewContainerRef, elementPositions, elementSizes])
  const templatePresets = {
    classic: {
      name: "Classic Certificate",
      description: "Traditional certificate design with elegant typography",
      primaryColor: "#1e3a5f",
      accentColor: "#c8a45a",
      fontStyle: "serif",
      layoutKey: "classic"
    },
    modern: {
      name: "Modern Certificate",
      description: "Clean and contemporary design",
      primaryColor: "#2563eb",
      accentColor: "#f59e0b",
      fontStyle: "sans-serif",
      layoutKey: "modern"
    },
    elegant: {
      name: "Elegant Certificate",
      description: "Sophisticated design with gold accents",
      primaryColor: "#1f2937",
      accentColor: "#d4af37",
      fontStyle: "serif",
      layoutKey: "elegant"
    },
    minimal: {
      name: "Minimal Certificate",
      description: "Simple and clean design",
      primaryColor: "#374151",
      accentColor: "#6b7280",
      fontStyle: "sans-serif",
      layoutKey: "minimal"
    },
    corporate: {
      name: "Corporate Certificate",
      description: "Professional business certificate",
      primaryColor: "#1e40af",
      accentColor: "#dc2626",
      fontStyle: "sans-serif",
      layoutKey: "corporate"
    }
  }

  const applyPreset = (presetKey: keyof typeof templatePresets) => {
    const preset = templatePresets[presetKey]
    setName(preset.name)
    setDescription(preset.description)
    setPrimaryColor(preset.primaryColor)
    setAccentColor(preset.accentColor)
    setFontStyle(preset.fontStyle)
    setLayoutKey(preset.layoutKey)
    toast.success(`Applied ${preset.name} preset`)
  }

  const addCustomField = () => {
    if (!newFieldName.trim()) {
      toast.error("Field name is required")
      return
    }
    const newField = {
      id: `field-${Date.now()}`,
      name: newFieldName,
      placeholder: newFieldPlaceholder,
      x: 50,
      y: 72 + customFields.length * 8,
      fontSize: 18,
    }
    setCustomFields([...customFields, newField])
    setNewFieldName("")
    setNewFieldPlaceholder("")
    toast.success("Field added")
  }

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id))
  }

  const handleAddLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      // Position logos in a grid: 2 columns, spaced across the page
      // PDF page is 842x595, so use reasonable spacing
      const logoIndex = logos.length
      const column = logoIndex % 2
      const row = Math.floor(logoIndex / 2)
      
      const newLogo = {
        id: `logo-${Date.now()}`,
        url: event.target?.result as string,
        position: {
          x: 50 + (column * 380),  // Left: 50, Right: 430
          y: 450 - (row * 150),    // Space vertically: 450, 300, 150
          width: 100,
          height: 100
        }
      }
      setLogos([...logos, newLogo])
      toast.success("Logo added")
      if (logoInputRef.current) {
        logoInputRef.current.value = ""
      }
    }
    reader.readAsDataURL(file)
  }

  const handleAddSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      // Position signatures in a grid: 2 columns, spaced across the page
      // PDF page is 842x595, so use reasonable spacing
      const sigIndex = signatures.length
      const column = sigIndex % 2
      const row = Math.floor(sigIndex / 2)
      
      const newSig = {
        id: `sig-${Date.now()}`,
        url: event.target?.result as string,
        position: {
          x: 80 + (column * 350),   // Left: 80, Right: 430
          y: 150 - (row * 90),      // Space vertically: 150, 60
          width: 150,
          height: 60
        }
      }
      setSignatures([...signatures, newSig])
      toast.success("Signature added")
      if (signatureInputRef.current) {
        signatureInputRef.current.value = ""
      }
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = (id: string) => {
    setLogos(logos.filter(l => l.id !== id))
  }

  const removeSignature = (id: string) => {
    setSignatures(signatures.filter(s => s.id !== id))
  }

  const toggleElement = (elementId: string) => {
    setEnabledElements(prev => ({
      ...prev,
      [elementId]: !prev[elementId]
    }))
  }

  const updateElementSize = (elementId: string, property: string, value: any) => {
    setElementSizes(prev => ({
      ...prev,
      [elementId]: {
        ...prev[elementId],
        [property]: value
      }
    }))

    // For image elements, also update elementPositions to keep them in sync
    if ((elementId === 'logo' || elementId === 'signature') && (property === 'width' || property === 'height') && previewContainerRef) {
      const rect = previewContainerRef.getBoundingClientRect()
      const containerWidth = rect.width
      const containerHeight = rect.height

      setElementPositions(prev => {
        const currentElement = prev[elementId as keyof typeof prev]
        let newWidth = currentElement.width
        let newHeight = currentElement.height

        if (property === 'width') {
          newWidth = (value / containerWidth) * 100
        } else if (property === 'height') {
          newHeight = (value / containerHeight) * 100
        }

        return {
          ...prev,
          [elementId]: {
            ...currentElement,
            width: Math.max(5, Math.min(50, newWidth)), // Reasonable bounds
            height: Math.max(3, Math.min(30, newHeight))
          }
        }
      })
    }
  }

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setSignatureUrl(event.target?.result as string)
      toast.success("Signature uploaded")
    }
    reader.readAsDataURL(file)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setLogoUrl(event.target?.result as string)
      toast.success("Logo uploaded")
    }
    reader.readAsDataURL(file)
  }

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setBackgroundUrl(event.target?.result as string)
      toast.success("Background uploaded")
    }
    reader.readAsDataURL(file)
  }

  const handleImportCsvFields = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        if (!headers.length) {
          toast.error("No CSV headers found")
          return
        }

        const newFields = headers.map((header, index) => ({
          id: `field-${Date.now()}-${index}`,
          name: header.trim(),
          placeholder: header.trim(),
          x: 50,
          y: 72 + index * 8,
          fontSize: 18,
        }))

        setCustomFields([...customFields, ...newFields])
        toast.success(`Added ${newFields.length} custom fields from CSV`)
        e.target.value = ""
      },
      error: () => {
        toast.error("Failed to parse CSV headers")
        e.target.value = ""
      },
    })
  }

  const getMimeType = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop() || ''
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'svg': 'image/svg+xml',
    }
    return mimeTypes[ext] || 'application/octet-stream'
  }

  const isValidFileType = (file: File): { isValid: boolean; type: 'zip' | 'json' | 'image' | 'pdf' | 'unknown' } => {
    const filename = file.name.toLowerCase()
    const fileType = file.type

    // Check file extension first (more reliable)
    if (filename.endsWith('.zip')) {
      return { isValid: true, type: 'zip' }
    }
    if (filename.endsWith('.json')) {
      return { isValid: true, type: 'json' }
    }
    if (filename.endsWith('.pdf')) {
      return { isValid: true, type: 'pdf' }
    }
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].some(ext => filename.endsWith(ext))) {
      return { isValid: true, type: 'image' }
    }

    // Fall back to MIME type
    if (fileType === 'application/zip' || fileType === 'application/x-zip-compressed') {
      return { isValid: true, type: 'zip' }
    }
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

  const handleImportTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Validate file type
      const fileValidation = isValidFileType(file)
      if (!fileValidation.isValid) {
        throw new Error(`Invalid file type. Please upload a ZIP, JSON, PDF, or image file. (Received: ${file.type || 'unknown'})`)
      }

      const isZip = fileValidation.type === 'zip'
      const isJson = fileValidation.type === 'json'
      const isPdf = fileValidation.type === 'pdf'
      const isImage = fileValidation.type === 'image'

      if (isZip) {
        // Handle ZIP file import
        try {
          console.log("Importing ZIP file:", file.name)
          const JSZip = (await import('jszip')).default
          const zip = new JSZip()
          const zipContent = await zip.loadAsync(file)
          console.log("ZIP loaded, files:", Object.keys(zipContent.files))

          // Find and read template.json
          let templateJsonFile = zipContent.file('template.json')
          if (!templateJsonFile) {
            const jsonFiles = Object.keys(zipContent.files).filter(filename => filename.endsWith('.json') && !filename.includes('/'))
            if (jsonFiles.length > 0) {
              console.log("Found JSON file:", jsonFiles[0])
              templateJsonFile = zipContent.file(jsonFiles[0])
            }
          }

          if (!templateJsonFile) {
            throw new Error("No template configuration file found in ZIP. Expected 'template.json'")
          }

          const templateText = await templateJsonFile.async('text')
          const importedTemplate = JSON.parse(templateText)
          console.log("Template parsed:", importedTemplate.name)

          // Validate imported template structure
          if (!importedTemplate.name) {
            throw new Error("Invalid template file - missing template name")
          }
          if (!importedTemplate.primaryColor) {
            throw new Error("Invalid template file - missing primary color")
          }

          // Process image files from ZIP
          let logoDataUrl = importedTemplate.logoUrl || ""
          let signatureDataUrl = importedTemplate.signatureUrl || ""
          let backgroundDataUrl = importedTemplate.backgroundUrl || ""

          // Check for image files in ZIP
          for (const filename in zipContent.files) {
            const zipFile = zipContent.files[filename]
            if (!zipFile.dir) {
              const lowerFilename = filename.toLowerCase()
              try {
                const imageData = await zipFile.async('base64')
                const mimeType = getMimeType(filename)
                const dataUrl = `data:${mimeType};base64,${imageData}`

                if (lowerFilename.includes('logo')) {
                  logoDataUrl = dataUrl
                  console.log("Loaded logo image")
                } else if (lowerFilename.includes('signature')) {
                  signatureDataUrl = dataUrl
                  console.log("Loaded signature image")
                } else if (lowerFilename.includes('background')) {
                  backgroundDataUrl = dataUrl
                  console.log("Loaded background image")
                }
              } catch (imgErr) {
                console.warn(`Failed to load image ${filename}:`, imgErr)
              }
            }
          }

          // Apply imported data
          setName(importedTemplate.name || "")
          setDescription(importedTemplate.description || "")
          setPrimaryColor(importedTemplate.primaryColor || "#1e3a5f")
          setAccentColor(importedTemplate.accentColor || "#c8a45a")
          setFontStyle(importedTemplate.fontStyle || "serif")
          setLayoutKey(importedTemplate.layoutKey || "classic")
          setSignatureUrl(signatureDataUrl)
          setLogoUrl(logoDataUrl)
          setBackgroundUrl(backgroundDataUrl)
          setCustomFields(importedTemplate.customFields || [])
          setEnabledElements(importedTemplate.enabledElements || {
            title: true,
            description: true,
            candidateName: true,
            eventName: true,
            logo: true,
            signature: true,
            date: true,
            qr: true,
            customFields: true,
          })
          setElementSizes(importedTemplate.elementSizes || {
            title: { fontSize: 48, fontWeight: 'bold' },
            description: { fontSize: 14 },
            candidateName: { fontSize: 40, fontWeight: 'bold' },
            eventName: { fontSize: 24 },
            logo: { width: 100, height: 100 },
            signature: { width: 150, height: 60 },
          })
          if (importedTemplate.elementPositions) {
            setElementPositions(importedTemplate.elementPositions)
          }

          if (importedTemplate.signaturePosition) {
            setSignatureX(importedTemplate.signaturePosition.x || 600)
            setSignatureY(importedTemplate.signaturePosition.y || 100)
            setSignatureWidth(importedTemplate.signaturePosition.width || 150)
            setSignatureHeight(importedTemplate.signaturePosition.height || 80)
          }

          if (importedTemplate.logoPosition) {
            setLogoX(importedTemplate.logoPosition.x || 50)
            setLogoY(importedTemplate.logoPosition.y || 50)
            setLogoWidth(importedTemplate.logoPosition.width || 100)
            setLogoHeight(importedTemplate.logoPosition.height || 100)
          }

          // Reset input field
          e.target.value = ""
          toast.success("✓ Template imported successfully from ZIP")
        } catch (zipErr) {
          throw new Error(`ZIP Import Error: ${zipErr instanceof Error ? zipErr.message : 'Unknown error'}`)
        }
      } else if (isJson) {
        // Handle JSON file import with proper Promise wrapping
        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader()
          
          reader.onload = (event) => {
            try {
              console.log("Reading JSON file:", file.name)
              const importedTemplate = JSON.parse(event.target?.result as string)

              if (!importedTemplate.name) {
                throw new Error("Invalid template file - missing template name")
              }
              if (!importedTemplate.primaryColor) {
                throw new Error("Invalid template file - missing primary color")
              }

              setName(importedTemplate.name || "")
              setDescription(importedTemplate.description || "")
              setPrimaryColor(importedTemplate.primaryColor || "#1e3a5f")
              setAccentColor(importedTemplate.accentColor || "#c8a45a")
              setFontStyle(importedTemplate.fontStyle || "serif")
              setLayoutKey(importedTemplate.layoutKey || "classic")
              setSignatureUrl(importedTemplate.signatureUrl || "")
              setLogoUrl(importedTemplate.logoUrl || "")
              setBackgroundUrl(importedTemplate.backgroundUrl || "")
              setCustomFields(importedTemplate.customFields || [])
              setEnabledElements(importedTemplate.enabledElements || {
                title: true,
                description: true,
                candidateName: true,
                eventName: true,
                logo: true,
                signature: true,
                date: true,
                qr: true,
                customFields: true,
              })
              setElementSizes(importedTemplate.elementSizes || {
                title: { fontSize: 48, fontWeight: 'bold' },
                description: { fontSize: 14 },
                candidateName: { fontSize: 40, fontWeight: 'bold' },
                eventName: { fontSize: 24 },
                logo: { width: 100, height: 100 },
                signature: { width: 150, height: 60 },
              })
              if (importedTemplate.elementPositions) {
                setElementPositions(importedTemplate.elementPositions)
              }

              if (importedTemplate.signaturePosition) {
                setSignatureX(importedTemplate.signaturePosition.x || 600)
                setSignatureY(importedTemplate.signaturePosition.y || 100)
                setSignatureWidth(importedTemplate.signaturePosition.width || 150)
                setSignatureHeight(importedTemplate.signaturePosition.height || 80)
              }

              if (importedTemplate.logoPosition) {
                setLogoX(importedTemplate.logoPosition.x || 50)
                setLogoY(importedTemplate.logoPosition.y || 50)
                setLogoWidth(importedTemplate.logoPosition.width || 100)
                setLogoHeight(importedTemplate.logoPosition.height || 100)
              }

              // Reset input field
              e.target.value = ""
              toast.success("✓ Template imported successfully")
              resolve()
            } catch (error) {
              reject(new Error(`JSON Parse Error: ${error instanceof Error ? error.message : 'Unknown error'}`))
            }
          }

          reader.onerror = () => {
            reject(new Error("Failed to read JSON file"))
          }

          console.log("Starting to read JSON file")
          reader.readAsText(file)
        })
      } else if (isPdf || isImage) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string
          if (!dataUrl) {
            toast.error("Failed to read uploaded file")
            e.target.value = ""
            return
          }

          setBackgroundUrl(dataUrl)
          setName(file.name.replace(/\.[^/.]+$/, ""))
          setDescription(isPdf ? "Imported PDF template background" : "Imported image template background")
          setLayoutKey("classic")
          setFontStyle("serif")
          toast.success(`Template imported from ${isPdf ? 'PDF' : 'image'}`)
          e.target.value = ""
        }
        reader.onerror = () => {
          toast.error("Failed to read file")
          e.target.value = ""
        }

        reader.readAsDataURL(file)
      } else {
        throw new Error("Please upload a ZIP, JSON, PDF, or image file")
      }
    } catch (error) {
      console.error("Import error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to import template"
      toast.error(errorMessage)
      // Reset input field on error too
      e.target.value = ""
    }
  }

  const getFileExtension = (mimeType: string): string => {
    const extensions: { [key: string]: string } = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
    }
    return extensions[mimeType] || 'bin'
  }

  const dataUrlToFile = (dataUrl: string, filename: string): { name: string; data: string } => {
    const [mimeInfo, data] = dataUrl.split(',')
    const mimeType = mimeInfo.match(/:(.*?);/)?.[1] || 'application/octet-stream'
    const ext = getFileExtension(mimeType)
    return {
      name: `${filename}.${ext}`,
      data: data,
    }
  }

  const handleExportTemplate = async () => {
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      const templateData = {
        name,
        description,
        primaryColor,
        accentColor,
        fontStyle,
        layoutKey,
        elementPositions,
        enabledElements,
        elementSizes,
        logos,
        signatures,
        signaturePosition: {
          x: signatureX,
          y: signatureY,
          width: signatureWidth,
          height: signatureHeight,
        },
        logoPosition: {
          x: logoX,
          y: logoY,
          width: logoWidth,
          height: logoHeight,
        },
        customFields,
        signatureUrl: signatureUrl && !signatureUrl.startsWith('data:') ? signatureUrl : '',
        logoUrl: logoUrl && !logoUrl.startsWith('data:') ? logoUrl : '',
        backgroundUrl: backgroundUrl && !backgroundUrl.startsWith('data:') ? backgroundUrl : '',
      }

      // Add template configuration
      zip.file('template.json', JSON.stringify(templateData, null, 2))

      // Add image files if they exist as data URLs
      if (logoUrl && logoUrl.startsWith('data:')) {
        const logoFile = dataUrlToFile(logoUrl, 'logo')
        zip.file(logoFile.name, logoFile.data)
      }

      if (signatureUrl && signatureUrl.startsWith('data:')) {
        const sigFile = dataUrlToFile(signatureUrl, 'signature')
        zip.file(sigFile.name, sigFile.data)
      }

      if (backgroundUrl && backgroundUrl.startsWith('data:')) {
        const bgFile = dataUrlToFile(backgroundUrl, 'background')
        zip.file(bgFile.name, bgFile.data)
      }

      // Generate ZIP file
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${name.replace(/\s+/g, '_').toLowerCase()}_template.zip`
      link.click()
      URL.revokeObjectURL(url)

      toast.success("Template exported successfully as ZIP")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export template")
    }
  }

  const previewWidth = 900
  const previewHeight = 640

  const mapToPercent = (value: number, max: number) =>
    `${Math.min(100, Math.max(0, Math.round((value / max) * 100)))}%`

  const mapPdfPositionToPreview = (position: { x: number; y: number; width: number; height: number }) => ({
    left: `${Math.min(100, Math.max(0, (position.x / 842) * 100))}%`,
    top: `${Math.min(100, Math.max(0, 100 - ((position.y + position.height) / 595) * 100))}%`,
    width: `${Math.min(100, Math.max(0, (position.width / 842) * 100))}%`,
    height: `${Math.min(100, Math.max(0, (position.height / 595) * 100))}%`,
  })

  const previewFont = fontStyle === "serif" ? "serif" : "sans-serif"

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Template name is required")
      return
    }

    setLoading(true)
    try {
      const data = {
        name,
        description,
        primaryColor,
        accentColor,
        fontStyle,
        layoutKey,
        signatureUrl,
        logoUrl,
        backgroundUrl,
        logos,
        signatures,
        customFields,
        elementPositions, // Include drag positions
        enabledElements, // Include visibility state
        elementSizes, // Include size settings
        signaturePosition: {
          x: signatureX,
          y: signatureY,
          width: signatureWidth,
          height: signatureHeight,
        },
        logoPosition: {
          x: logoX,
          y: logoY,
          width: logoWidth,
          height: logoHeight,
        },
      }

      await onSave?.(data)
      toast.success("Template saved successfully")
    } catch {
      toast.error("Failed to save template")
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basics" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="basics"><Type className="w-4 h-4" /> Basics</TabsTrigger>
          <TabsTrigger value="layout"><Palette className="w-4 h-4" /> Layout</TabsTrigger>
          <TabsTrigger value="colors"><Palette className="w-4 h-4" /> Colors</TabsTrigger>
          <TabsTrigger value="images"><Image className="w-4 h-4" /> Images</TabsTrigger>
          <TabsTrigger value="signature"><FileText className="w-4 h-4" /> Signature</TabsTrigger>
          <TabsTrigger value="fields"><Plus className="w-4 h-4" /> Fields</TabsTrigger>
          <TabsTrigger value="sizing"><Type className="w-4 h-4" /> Sizing</TabsTrigger>
        </TabsList>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificate Layout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="layoutKey">Layout Style</Label>
                <Select value={layoutKey} onValueChange={setLayoutKey}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="elegant">Elegant</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Quick Presets</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(templatePresets).map(([key, preset]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(key as keyof typeof templatePresets)}
                      className="text-xs"
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Click any preset to apply its styling instantly</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Import Template</Label>
                  <Input
                    type="file"
                    accept=".json,.zip,.pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,image/*,application/pdf,application/json,application/zip,application/x-zip-compressed"
                    onChange={handleImportTemplate}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">Import a template (.json, .zip, PDF, or image)</p>
                </div>

                <div className="space-y-2">
                  <Label>Export Template</Label>
                  <Button onClick={handleExportTemplate} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Template
                  </Button>
                  <p className="text-xs text-muted-foreground">Download template as ZIP file with images</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="basics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Professional Certificate"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this certificate template..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontStyle">Font Style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["serif", "sans-serif"].map((style) => (
                    <Button
                      key={style}
                      variant={fontStyle === style ? "default" : "outline"}
                      onClick={() => setFontStyle(style)}
                      className={fontStyle === style ? "" : ""}
                      style={fontStyle === style ? {} : { fontFamily: style === "serif" ? "serif" : "sans-serif" }}
                    >
                      {style === "serif" ? "Serif" : "Sans-Serif"}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Primary Color</Label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label>Accent Color</Label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 font-mono"
                  />
                </div>
              </div>

              {/* Preview */}
              <Card className="bg-muted p-6">
                <div className="text-center space-y-2">
                  <div
                    className="text-2xl font-bold"
                    style={{ color: primaryColor }}
                  >
                    Sample Title
                  </div>
                  <div
                    className="h-1 w-20 mx-auto"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div className="text-sm text-muted-foreground">
                    This is how your colors will look
                  </div>
                </div>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificate Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo-upload">Organization Logo</Label>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  {logoUrl && (
                    <div className="mt-4 p-4 border-2 border-blue-300 rounded-lg bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30">
                      <div className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">✓ Logo Uploaded</div>
                      <div className="flex justify-center items-center min-h-48 bg-white rounded">
                        <img
                          src={logoUrl}
                          alt="Logo preview"
                          className="max-h-40 max-w-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Multiple Logos Section */}
                <div className="border-t pt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Additional Logos ({logos.length})</Label>
                    <div>
                      <Button variant="outline" size="sm" type="button" onClick={openLogoInput}>
                        <Plus className="w-4 h-4 mr-1" /> Add Logo
                      </Button>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAddLogo}
                        className="hidden"
                      />
                    </div>
                  </div>
                  {logos.length > 0 && (
                    <div className="space-y-3">
                      {logos.map((logo)=> (
                        <div key={logo.id} className="p-3 border rounded-lg flex items-center justify-between bg-muted/50">
                          <div className="flex items-center gap-3">
                            <img src={logo.url} alt="Logo" className="h-12 w-12 object-contain rounded" />
                            <span className="text-sm font-medium truncate">Logo {logos.indexOf(logo) + 1}</span>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeLogo(logo.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background-upload">Background Image</Label>
                  <Input
                    id="background-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                  />
                  {backgroundUrl && (
                    <div className="mt-4 p-4 border-2 border-green-300 rounded-lg bg-green-50 dark:border-green-700 dark:bg-green-950/30">
                      <div className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">✓ Background Uploaded</div>
                      <div className="flex justify-center items-center min-h-48 bg-white rounded overflow-hidden">
                        <img
                          src={backgroundUrl}
                          alt="Background preview"
                          className="max-h-40 max-w-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>


            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signature" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Digital Signature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature-upload">Upload Signature Image</Label>
                <Input
                  id="signature-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                />
                {signatureUrl && (
                  <div className="mt-4 p-4 border-2 border-purple-300 rounded-lg bg-purple-50 dark:border-purple-700 dark:bg-purple-950/30">
                    <div className="text-sm font-medium text-green-700 dark:text-green-400 mb-2">✓ Signature Uploaded</div>
                    <div className="flex justify-center items-center min-h-40 bg-white rounded p-4">
                      <img
                        src={signatureUrl}
                        alt="Signature preview"
                        className="max-h-32 max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Multiple Signatures Section */}
              <div className="border-t pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Additional Signatures ({signatures.length})</Label>
                  <div>
                    <Button variant="outline" size="sm" type="button" onClick={openSignatureInput}>
                      <Plus className="w-4 h-4 mr-1" /> Add Signature
                    </Button>
                    <input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAddSignature}
                      className="hidden"
                    />
                  </div>
                </div>
                {signatures.length > 0 && (
                  <div className="space-y-3">
                    {signatures.map((sig) => (
                      <div key={sig.id} className="p-3 border rounded-lg flex items-center justify-between bg-muted/50">
                        <div className="flex items-center gap-3">
                          <img src={sig.url} alt="Signature" className="h-12 w-12 object-contain rounded" />
                          <span className="text-sm font-medium truncate">Signature {signatures.indexOf(sig) + 1}</span>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSignature(sig.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Fields Tab */}
        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customFields.length > 0 && (
                <div className="space-y-2 mb-4">
                  {customFields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{field.name}</div>
                        <div className="text-xs text-muted-foreground">{field.placeholder}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomField(field.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 border rounded-lg space-y-3">
                <h4 className="font-semibold">Add New Field</h4>
                <Input
                  placeholder="Field name (e.g., Course Duration)"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                />
                <Input
                  placeholder="Placeholder text (optional)"
                  value={newFieldPlaceholder}
                  onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                />
                <Button onClick={addCustomField} className="w-full">
                  <Plus className="w-4 h-4" />
                  Add Field
                </Button>
              </div>
              <div className="p-4 border rounded-lg space-y-3">
                <h4 className="font-semibold">Import CSV Fields</h4>
                <Input type="file" accept=".csv,text/csv" onChange={handleImportCsvFields} />
                <p className="text-xs text-muted-foreground">Upload a CSV with headers. Each header becomes a custom field in the template.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sizing Tab */}
        <TabsContent value="sizing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Element Sizing</CardTitle>
              <CardDescription>Customize the size of all elements on the certificate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100"><span className="font-semibold">💡 Tip:</span> You can also resize Logo and Signature by dragging the corner handles (●) in the Live Preview below. For text elements (Title, Description, etc.), drag the corner handle to increase/decrease font size!</p>
              </div>
              {/* Text Sizing */}
              <div className="space-y-4 pb-4 border-b">
                <h4 className="font-semibold text-lg">Text Sizing</h4>
                
                {/* Title Size */}
                <div className="space-y-2">
                  <Label>Title Font Size</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="8"
                      max="72"
                      value={elementSizes.title?.fontSize || 48}
                      onChange={(e) => updateElementSize('title', 'fontSize', Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">pixels</span>
                    <div 
                      style={{ fontSize: `${(elementSizes.title?.fontSize || 48) / 1.5}px` }}
                      className="ml-auto font-bold"
                    >
                      Preview
                    </div>
                  </div>
                </div>

                {/* Description Size */}
                <div className="space-y-2">
                  <Label>Description Font Size</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="8"
                      max="48"
                      value={elementSizes.description?.fontSize || 14}
                      onChange={(e) => updateElementSize('description', 'fontSize', Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">pixels</span>
                    <div style={{ fontSize: `${(elementSizes.description?.fontSize || 14) / 1.5}px` }} className="ml-auto">
                      Preview
                    </div>
                  </div>
                </div>

                {/* Candidate Name Size */}
                <div className="space-y-2">
                  <Label>Candidate Name Font Size</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="8"
                      max="72"
                      value={elementSizes.candidateName?.fontSize || 40}
                      onChange={(e) => updateElementSize('candidateName', 'fontSize', Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">pixels</span>
                    <div style={{ fontSize: `${(elementSizes.candidateName?.fontSize || 40) / 1.5}px` }} className="ml-auto font-bold">
                      Preview
                    </div>
                  </div>
                </div>

                {/* Event Name Size */}
                <div className="space-y-2">
                  <Label>Event Name Font Size</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="8"
                      max="48"
                      value={elementSizes.eventName?.fontSize || 24}
                      onChange={(e) => updateElementSize('eventName', 'fontSize', Number(e.target.value))}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">pixels</span>
                    <div style={{ fontSize: `${(elementSizes.eventName?.fontSize || 24) / 1.5}px` }} className="ml-auto">
                      Preview
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Sizing */}
              <div className="space-y-4 pb-4 border-b">
                <h4 className="font-semibold text-lg">Image Sizing</h4>

                {/* Logo Size */}
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <h5 className="font-medium text-sm">Logo Dimensions</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Width (px)</Label>
                      <Input
                        type="number"
                        min="20"
                        max="500"
                        value={elementSizes.logo?.width || 100}
                        onChange={(e) => updateElementSize('logo', 'width', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Height (px)</Label>
                      <Input
                        type="number"
                        min="20"
                        max="500"
                        value={elementSizes.logo?.height || 100}
                        onChange={(e) => updateElementSize('logo', 'height', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Aspect ratio: {(elementSizes.logo?.width || 100) / (elementSizes.logo?.height || 100)}:1
                  </div>
                </div>

                {/* Signature Size */}
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <h5 className="font-medium text-sm">Signature Dimensions</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Width (px)</Label>
                      <Input
                        type="number"
                        min="50"
                        max="500"
                        value={elementSizes.signature?.width || 150}
                        onChange={(e) => updateElementSize('signature', 'width', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Height (px)</Label>
                      <Input
                        type="number"
                        min="20"
                        max="300"
                        value={elementSizes.signature?.height || 60}
                        onChange={(e) => updateElementSize('signature', 'height', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Aspect ratio: {(elementSizes.signature?.width || 150) / (elementSizes.signature?.height || 60)}:1
                  </div>
                </div>
              </div>

              {/* QR Code Positioning */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <h5 className="font-medium text-sm">QR Code Positioning</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>X Position (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={Math.round(elementPositions.qr?.x || 85)}
                      onChange={(e) => setElementPositions(prev => ({
                        ...prev,
                        qr: { ...prev.qr, x: Math.max(0, Math.min(100, Number(e.target.value))) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Y Position (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={Math.round(elementPositions.qr?.y || 85)}
                      onChange={(e) => setElementPositions(prev => ({
                        ...prev,
                        qr: { ...prev.qr, y: Math.max(0, Math.min(100, Number(e.target.value))) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Width (%)</Label>
                    <Input
                      type="number"
                      min="5"
                      max="30"
                      step="1"
                      value={Math.round(elementPositions.qr?.width || 12)}
                      onChange={(e) => setElementPositions(prev => ({
                        ...prev,
                        qr: { ...prev.qr, width: Math.max(5, Math.min(30, Number(e.target.value))) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height (%)</Label>
                    <Input
                      type="number"
                      min="5"
                      max="30"
                      step="1"
                      value={Math.round(elementPositions.qr?.height || 12)}
                      onChange={(e) => setElementPositions(prev => ({
                        ...prev,
                        qr: { ...prev.qr, height: Math.max(5, Math.min(30, Number(e.target.value))) }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Certificate ID Positioning */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <h5 className="font-medium text-sm">Certificate ID Positioning</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>X Position (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={Math.round(elementPositions.certificateId?.x || 50)}
                      onChange={(e) => setElementPositions(prev => ({
                        ...prev,
                        certificateId: { ...prev.certificateId, x: Math.max(0, Math.min(100, Number(e.target.value))) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Y Position (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={Math.round(elementPositions.certificateId?.y || 92)}
                      onChange={(e) => setElementPositions(prev => ({
                        ...prev,
                        certificateId: { ...prev.certificateId, y: Math.max(0, Math.min(100, Number(e.target.value))) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Width (%)</Label>
                    <Input
                      type="number"
                      min="20"
                      max="80"
                      step="5"
                      value={Math.round(elementPositions.certificateId?.width || 40)}
                      onChange={(e) => setElementPositions(prev => ({
                        ...prev,
                        certificateId: { ...prev.certificateId, width: Math.max(20, Math.min(80, Number(e.target.value))) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height (%)</Label>
                    <Input
                      type="number"
                      min="2"
                      max="5"
                      step="0.5"
                      value={Math.round(elementPositions.certificateId?.height * 10) / 10 || 3}
                      onChange={(e) => setElementPositions(prev => ({
                        ...prev,
                        certificateId: { ...prev.certificateId, height: Math.max(2, Math.min(5, Number(e.target.value))) }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Design Elements Sizing */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Design Elements</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Border Thickness</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={elementSizes.borderThickness || 2}
                        onChange={(e) => updateElementSize('title', 'borderThickness', Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">px</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Line Separator Height</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="1"
                        max="8"
                        value={elementSizes.lineHeight || 2}
                        onChange={(e) => updateElementSize('title', 'lineHeight', Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">px</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Corner Accent Size</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="5"
                        max="50"
                        value={elementSizes.cornerSize || 20}
                        onChange={(e) => updateElementSize('title', 'cornerSize', Number(e.target.value))}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">px</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Live Template Preview</CardTitle>
          <CardDescription>Drag elements to position them. Toggle elements to show/hide on certificates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
            <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">📍 Show/Hide Elements</h4>
            <p className="text-xs text-blue-800 dark:text-blue-200">Toggle elements on/off below. After uploading logo or signature, make sure they are ENABLED (✓) to see them on the certificate preview.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: 'title', label: 'Title' },
                { id: 'description', label: 'Description' },
                { id: 'candidateName', label: 'Candidate Name' },
                { id: 'eventName', label: 'Event Name' },
                { id: 'logo', label: 'Logo' },
                { id: 'signature', label: 'Signature' },
                { id: 'date', label: 'Date' },
                { id: 'qr', label: 'QR Code' },
                { id: 'customFields', label: 'Custom Fields' },
              ].map(({ id, label }) => (
                <Button
                  key={id}
                  variant={enabledElements[id as keyof typeof enabledElements] ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleElement(id)}
                  className="text-xs w-full"
                >
                  {enabledElements[id as keyof typeof enabledElements] ? '✓ ' : ''}{label}
                </Button>
              ))}
            </div>
          </div>
          
          <div
            className="relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-white cursor-crosshair"
            style={{ paddingTop: "70%" }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            ref={setPreviewContainerRef}
          >
            <div className="absolute inset-0 overflow-hidden">
              {backgroundUrl ? (
                backgroundUrl.startsWith('data:application/pdf') || backgroundUrl.match(/\.pdf($|\?)/i) ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 text-sm text-slate-700">
                    PDF background imported successfully
                  </div>
                ) : (
                  <img
                    src={backgroundUrl}
                    alt="Template background"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200" />
              )}
              <div className="absolute inset-0 bg-black/5" />

              {enabledElements.title && (
                <div className="absolute text-center px-4 cursor-move group"
                  style={{
                    left: `${elementPositions.title.x}%`,
                    top: `${elementPositions.title.y}%`,
                    color: primaryColor,
                    fontFamily: previewFont,
                    fontSize: `${(elementSizes.title?.fontSize || 48) / 1.5}px`,
                    fontWeight: 'bold',
                  }}
                  draggable
                  onDragStart={() => handleDragStart('title')}
                  onDragEnd={handleDragEnd}
                >
                  {name || "Certificate Title"}
                  
                  {/* Resize Handles for Text */}
                  {/* SE Corner */}
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize transform translate-x-1.5 translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'title', 'se')}
                    title="Drag to resize text"
                  />
                </div>
              )}

              {enabledElements.description && (
                <div className="absolute text-center px-4 cursor-move group"
                  style={{
                    left: `${elementPositions.description.x}%`,
                    top: `${elementPositions.description.y}%`,
                    color: primaryColor,
                    fontFamily: previewFont,
                    fontSize: `${(elementSizes.description?.fontSize || 14) / 1.5}px`,
                  }}
                  draggable
                  onDragStart={() => handleDragStart('description')}
                  onDragEnd={handleDragEnd}
                >
                  {description || "Certificate subtitle or event description goes here."}
                  
                  {/* Resize Handles for Text */}
                  {/* SE Corner */}
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize transform translate-x-1.5 translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'description', 'se')}
                    title="Drag to resize text"
                  />
                </div>
              )}

              {enabledElements.candidateName && (
                <div className="absolute text-center px-4 cursor-move group hover:bg-blue-100/20 rounded"
                  style={{
                    left: `${elementPositions.candidateName.x}%`,
                    top: `${elementPositions.candidateName.y}%`,
                    color: primaryColor,
                    fontFamily: previewFont,
                    fontSize: `${(elementSizes.candidateName?.fontSize || 40) / 1.5}px`,
                    fontWeight: 'bold'
                  }}
                  draggable
                  onDragStart={() => handleDragStart('candidateName')}
                  onDragEnd={handleDragEnd}
                >
                  Candidate Name
                  
                  {/* Resize Handles for Text */}
                  {/* SE Corner */}
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize transform translate-x-1.5 translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'candidateName', 'se')}
                    title="Drag to resize text"
                  />
                </div>
              )}

              {enabledElements.eventName && (
                <div className="absolute text-center px-4 cursor-move group hover:bg-blue-100/20 rounded"
                  style={{
                    left: `${elementPositions.eventName.x}%`,
                    top: `${elementPositions.eventName.y}%`,
                    color: accentColor,
                    fontFamily: previewFont,
                    fontSize: `${(elementSizes.eventName?.fontSize || 24) / 1.5}px`
                  }}
                  draggable
                  onDragStart={() => handleDragStart('eventName')}
                  onDragEnd={handleDragEnd}
                >
                  Event Name • Achievement
                  
                  {/* Resize Handles for Text */}
                  {/* SE Corner */}
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-nwse-resize transform translate-x-1.5 translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'eventName', 'se')}
                    title="Drag to resize text"
                  />
                </div>
              )}

              {enabledElements.customFields !== false && customFields.map((field) => (
                <div
                  key={field.id}
                  className="absolute rounded-md bg-white/80 px-3 py-2 text-xs text-slate-700 shadow cursor-move hover:bg-blue-100/20"
                  style={{
                    left: `${field.x ?? 50}%`,
                    top: `${field.y ?? 72}%`,
                    fontFamily: previewFont,
                    fontSize: `${(field.fontSize || 16) / 1.5}px`,
                    minWidth: "120px",
                  }}
                  draggable
                  onDragStart={() => handleDragStart(`custom-${field.id}`)}
                  onDragEnd={handleDragEnd}
                >
                  {field.name}: {field.placeholder || "Value"}
                </div>
              ))}

              {enabledElements.logo && logoUrl && (
                <div className="absolute cursor-move group"
                  style={{
                    left: `${elementPositions.logo.x}%`,
                    top: `${elementPositions.logo.y}%`,
                    width: `${elementPositions.logo.width}%`,
                    height: `${elementPositions.logo.height}%`,
                  }}
                  draggable
                  onDragStart={() => handleDragStart('logo')}
                  onDragEnd={handleDragEnd}
                >
                  <div className="w-full h-full border-2 border-green-400 rounded overflow-hidden bg-white/80 p-1 hover:border-green-600">
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  {/* Resize Handles */}
                  {/* NW Corner */}
                  <div
                    className="absolute top-0 left-0 w-3 h-3 bg-green-500 border border-white cursor-nwse-resize transform -translate-x-1.5 -translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'logo', 'nw')}
                    title="Drag to resize from top-left"
                  />
                  {/* NE Corner */}
                  <div
                    className="absolute top-0 right-0 w-3 h-3 bg-green-500 border border-white cursor-nesw-resize transform translate-x-1.5 -translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'logo', 'ne')}
                    title="Drag to resize from top-right"
                  />
                  {/* SW Corner */}
                  <div
                    className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border border-white cursor-nesw-resize transform -translate-x-1.5 translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'logo', 'sw')}
                    title="Drag to resize from bottom-left"
                  />
                  {/* SE Corner */}
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border border-white cursor-nwse-resize transform translate-x-1.5 translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'logo', 'se')}
                    title="Drag to resize from bottom-right"
                  />
                </div>
              )}

              {enabledElements.logo && logos.length > 0 && logos.map((logo) => {
                const previewStyle = logo.position
                  ? mapPdfPositionToPreview(logo.position)
                  : { left: '5%', top: '75%', width: '15%', height: '15%' }
                return (
                  <div
                    key={logo.id}
                    className="absolute cursor-move group"
                    style={previewStyle}
                    draggable
                    onDragStart={() => handleDragStart(`logo-${logo.id}`)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="w-full h-full border-2 border-green-300 rounded overflow-hidden bg-white/80 p-1">
                      <img src={logo.url} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div
                      className="absolute bottom-0 right-0 cursor-nwse-resize bg-green-500 border border-white rounded-full opacity-0 group-hover:opacity-100"
                      style={{ width: '12px', height: '12px', transform: 'translate(50%, 50%)' }}
                      onMouseDown={(e) => handleResizeStart(e, `logo-${logo.id}`, 'se')}
                      title="Drag to resize logo"
                    />
                  </div>
                )
              })}

              {enabledElements.signature && signatureUrl && (
                <div className="absolute cursor-move group"
                  style={{
                    left: `${elementPositions.signature.x}%`,
                    top: `${elementPositions.signature.y}%`,
                    width: `${elementPositions.signature.width}%`,
                    height: `${elementPositions.signature.height}%`,
                  }}
                  draggable
                  onDragStart={() => handleDragStart('signature')}
                  onDragEnd={handleDragEnd}
                >
                  <div className="w-full h-full border-2 border-purple-400 rounded overflow-hidden bg-white/80 p-1 hover:border-purple-600">
                    <img
                      src={signatureUrl}
                      alt="Signature"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  {/* Resize Handles */}
                  {/* NW Corner */}
                  <div
                    className="absolute top-0 left-0 w-3 h-3 bg-purple-500 border border-white cursor-nwse-resize transform -translate-x-1.5 -translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'signature', 'nw')}
                    title="Drag to resize from top-left"
                  />
                  {/* NE Corner */}
                  <div
                    className="absolute top-0 right-0 w-3 h-3 bg-purple-500 border border-white cursor-nesw-resize transform translate-x-1.5 -translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'signature', 'ne')}
                    title="Drag to resize from top-right"
                  />
                  {/* SW Corner */}
                  <div
                    className="absolute bottom-0 left-0 w-3 h-3 bg-purple-500 border border-white cursor-nesw-resize transform -translate-x-1.5 translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'signature', 'sw')}
                    title="Drag to resize from bottom-left"
                  />
                  {/* SE Corner */}
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-purple-500 border border-white cursor-nwse-resize transform translate-x-1.5 translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'signature', 'se')}
                    title="Drag to resize from bottom-right"
                  />
                </div>
              )}

              {enabledElements.signature && signatures.length > 0 && signatures.map((sig) => {
                const previewStyle = sig.position
                  ? mapPdfPositionToPreview(sig.position)
                  : { left: '60%', top: '75%', width: '20%', height: '10%' }
                return (
                  <div
                    key={sig.id}
                    className="absolute cursor-move group"
                    style={previewStyle}
                    draggable
                    onDragStart={() => handleDragStart(`signature-${sig.id}`)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="w-full h-full border-2 border-purple-300 rounded overflow-hidden bg-white/80 p-1">
                      <img src={sig.url} alt="Signature" className="w-full h-full object-contain" />
                    </div>
                    <div
                      className="absolute bottom-0 right-0 cursor-nwse-resize bg-purple-500 border border-white rounded-full opacity-0 group-hover:opacity-100"
                      style={{ width: '12px', height: '12px', transform: 'translate(50%, 50%)' }}
                      onMouseDown={(e) => handleResizeStart(e, `signature-${sig.id}`, 'se')}
                      title="Drag to resize signature"
                    />
                  </div>
                )
              })}

              {enabledElements.qr && (
                <div className="absolute cursor-move group"
                  style={{
                    left: `${elementPositions.qr.x}%`,
                    top: `${elementPositions.qr.y}%`,
                    width: `${elementPositions.qr.width}%`,
                    height: `${elementPositions.qr.height}%`,
                  }}
                  draggable
                  onDragStart={() => handleDragStart('qr')}
                  onDragEnd={handleDragEnd}
                >
                  <div className="w-full h-full border-2 border-orange-400 rounded overflow-hidden bg-white/80 p-1 hover:border-orange-600 flex items-center justify-center">
                    <div className="text-xs font-semibold text-orange-700">QR</div>
                  </div>
                  {/* Resize Handles */}
                  <div
                    className="absolute top-0 left-0 w-3 h-3 bg-orange-500 border border-white cursor-nwse-resize transform -translate-x-1.5 -translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'qr', 'nw')}
                    title="Drag to resize from top-left"
                  />
                  <div
                    className="absolute top-0 right-0 w-3 h-3 bg-orange-500 border border-white cursor-nesw-resize transform translate-x-1.5 -translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'qr', 'ne')}
                    title="Drag to resize from top-right"
                  />
                  <div
                    className="absolute bottom-0 left-0 w-3 h-3 bg-orange-500 border border-white cursor-nesw-resize transform -translate-x-1.5 translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'qr', 'sw')}
                    title="Drag to resize from bottom-left"
                  />
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-orange-500 border border-white cursor-nwse-resize transform translate-x-1.5 translate-y-1.5 rounded-full opacity-0 group-hover:opacity-100"
                    onMouseDown={(e) => handleResizeStart(e, 'qr', 'se')}
                    title="Drag to resize from bottom-right"
                  />
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white text-xs p-3 rounded text-center space-y-1">
                <div>📍 Drag elements to reposition | Hover over elements to see corner resize handles</div>
                <div className="text-xs opacity-90">🔲 Drag corner handles (●) to resize logo, signature, QR, or text elements</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Template</p>
              <p className="font-medium text-foreground">{name || "Untitled Template"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Layout</p>
              <p className="font-medium text-foreground capitalize">{layoutKey}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Colors</p>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full" style={{ backgroundColor: primaryColor }} />
                <span className="w-5 h-5 rounded-full" style={{ backgroundColor: accentColor }} />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Images</p>
              <p className="font-medium text-foreground">{backgroundUrl ? "Background set" : "No background"}, {logoUrl ? "Logo set" : "No logo"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Signature</p>
              <p className="font-medium text-foreground">{signatureUrl ? "Uploaded" : "Not uploaded"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Custom Fields</p>
              <p className="font-medium text-foreground">{customFields.length} field(s)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save Template
        </Button>
      </div>
    </div>
  )
}
