"use client"

import { memo } from "react"
import type { Template } from "@/lib/types"

interface TemplatePreviewProps {
  template?: Template
  containerRef: (ref: HTMLDivElement | null) => void
  elementPositions: Record<string, any>
  elementSizes: Record<string, any>
  enabledElements: Record<string, boolean>
  primaryColor: string
  accentColor: string
  logoUrl: string
  signatureUrl: string
  backgroundUrl: string
  logos?: Array<{ id: string; url: string; position?: { x: number; y: number; width: number; height: number } }>
  signatures?: Array<{ id: string; url: string; position?: { x: number; y: number; width: number; height: number } }>
  fontStyle: string
  onDragStart: (element: string) => (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (element: string) => (e: React.DragEvent) => void
  onResizeStart: (e: React.MouseEvent, element: string, corner: string) => void
}

export const TemplatePreview = memo(function TemplatePreview({
  template,
  containerRef,
  elementPositions,
  elementSizes,
  enabledElements,
  primaryColor,
  accentColor,
  logoUrl,
  signatureUrl,
  backgroundUrl,
  logos = [],
  signatures = [],
  fontStyle,
  onDragStart,
  onDragOver,
  onDrop,
  onResizeStart,
}: TemplatePreviewProps) {
  const previewWidth = 800
  const previewHeight = 600

  const mapPdfPositionToPreview = (position: { x: number; y: number; width: number; height: number }) => ({
    left: `${Math.min(100, Math.max(0, (position.x / 842) * 100))}%`,
    top: `${Math.min(100, Math.max(0, 100 - ((position.y + position.height) / 595) * 100))}%`,
    width: `${Math.min(100, Math.max(0, (position.width / 842) * 100))}%`,
    height: `${Math.min(100, Math.max(0, (position.height / 595) * 100))}%`,
  })

  const getElementStyle = (element: string, pos: any) => {
    return {
      position: 'absolute' as const,
      left: `${pos.x}%`,
      top: `${pos.y}%`,
      width: `${pos.width}%`,
      height: `${pos.height}%`,
      cursor: 'move',
    }
  }

  const getTitleStyle = () => ({
    fontSize: `${elementSizes.title?.fontSize / 1.5 || 32}px`,
    fontWeight: elementSizes.title?.fontWeight || 'bold',
  })

  const getDescriptionStyle = () => ({
    fontSize: `${elementSizes.description?.fontSize / 1.5 || 10}px`,
  })

  const getCandidateNameStyle = () => ({
    fontSize: `${elementSizes.candidateName?.fontSize / 1.5 || 27}px`,
    fontWeight: elementSizes.candidateName?.fontWeight || 'bold',
  })

  const getEventNameStyle = () => ({
    fontSize: `${elementSizes.eventName?.fontSize / 1.5 || 16}px`,
  })

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-gradient-to-br rounded-lg shadow-lg overflow-hidden border-2"
      style={{
        aspectRatio: '4/3',
        backgroundColor: '#f5f5f5',
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onDragOver={onDragOver}
    >
      {/* Certificate background */}
      <div className="absolute inset-0 bg-white bg-opacity-95" style={{ borderColor: primaryColor }} />

      {/* Title */}
      {enabledElements.title && (
        <div
          className="absolute flex items-center justify-center text-center pointer-events-auto"
          style={getElementStyle('title', elementPositions.title)}
          draggable
          onDragStart={onDragStart('title')}
          onDrop={onDrop('title')}
        >
          <div style={getTitleStyle()} className="truncate">
            Certificate of Achievement
          </div>
          <div
            className="absolute bottom-0 right-0 cursor-nwse-resize bg-blue-500 rounded-full"
            style={{ width: '12px', height: '12px' }}
            onMouseDown={(e) => onResizeStart(e, 'title', 'se')}
          />
        </div>
      )}

      {/* Description */}
      {enabledElements.description && (
        <div
          className="absolute flex items-center justify-center text-center pointer-events-auto"
          style={getElementStyle('description', elementPositions.description)}
          draggable
          onDragStart={onDragStart('description')}
          onDrop={onDrop('description')}
        >
          <div style={getDescriptionStyle()} className="text-gray-600 truncate">
            This is to certify that
          </div>
          <div
            className="absolute bottom-0 right-0 cursor-nwse-resize bg-blue-500 rounded-full"
            style={{ width: '12px', height: '12px' }}
            onMouseDown={(e) => onResizeStart(e, 'description', 'se')}
          />
        </div>
      )}

      {/* Candidate Name */}
      {enabledElements.candidateName && (
        <div
          className="absolute flex items-center justify-center text-center pointer-events-auto"
          style={getElementStyle('candidateName', elementPositions.candidateName)}
          draggable
          onDragStart={onDragStart('candidateName')}
          onDrop={onDrop('candidateName')}
        >
          <div style={{ ...getCandidateNameStyle(), color: primaryColor }} className="truncate">
            [Candidate Name]
          </div>
          <div
            className="absolute bottom-0 right-0 cursor-nwse-resize bg-blue-500 rounded-full"
            style={{ width: '12px', height: '12px' }}
            onMouseDown={(e) => onResizeStart(e, 'candidateName', 'se')}
          />
        </div>
      )}

      {/* Event Name */}
      {enabledElements.eventName && (
        <div
          className="absolute flex items-center justify-center text-center pointer-events-auto"
          style={getElementStyle('eventName', elementPositions.eventName)}
          draggable
          onDragStart={onDragStart('eventName')}
          onDrop={onDrop('eventName')}
        >
          <div style={getEventNameStyle()} className="text-gray-700 truncate">
            [Event Name]
          </div>
          <div
            className="absolute bottom-0 right-0 cursor-nwse-resize bg-blue-500 rounded-full"
            style={{ width: '12px', height: '12px' }}
            onMouseDown={(e) => onResizeStart(e, 'eventName', 'se')}
          />
        </div>
      )}

      {/* Logo */}
      {enabledElements.logo && logoUrl && (
        <div
          className="absolute pointer-events-auto"
          style={getElementStyle('logo', elementPositions.logo)}
          draggable
          onDragStart={onDragStart('logo')}
          onDrop={onDrop('logo')}
        >
          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
          <div
            className="absolute bottom-0 right-0 cursor-nwse-resize bg-blue-500 rounded-full"
            style={{ width: '12px', height: '12px' }}
            onMouseDown={(e) => onResizeStart(e, 'logo', 'se')}
          />
        </div>
      )}

      {enabledElements.logo && logos?.length > 0 && logos.map((logo) => {
        const previewStyle = logo.position
          ? mapPdfPositionToPreview(logo.position)
          : { left: '5%', top: '75%', width: '15%', height: '15%' }

        return (
          <div
            key={logo.id}
            className="absolute pointer-events-auto"
            style={previewStyle}
            draggable
            onDragStart={onDragStart(`logo-${logo.id}`)}
            onDrop={onDrop(`logo-${logo.id}`)}
          >
            <img src={logo.url} alt="Logo" className="w-full h-full object-contain" />
            <div
              className="absolute bottom-0 right-0 cursor-nwse-resize bg-green-500 rounded-full"
              style={{ width: '12px', height: '12px' }}
              onMouseDown={(e) => onResizeStart(e, `logo-${logo.id}`, 'se')}
            />
          </div>
        )
      })}

      {/* Signature */}
      {enabledElements.signature && signatureUrl && (
        <div
          className="absolute pointer-events-auto"
          style={getElementStyle('signature', elementPositions.signature)}
          draggable
          onDragStart={onDragStart('signature')}
          onDrop={onDrop('signature')}
        >
          <img src={signatureUrl} alt="Signature" className="w-full h-full object-contain" />
          <div
            className="absolute bottom-0 right-0 cursor-nwse-resize bg-blue-500 rounded-full"
            style={{ width: '12px', height: '12px' }}
            onMouseDown={(e) => onResizeStart(e, 'signature', 'se')}
          />
        </div>
      )}

      {enabledElements.signature && signatures?.length > 0 && signatures.map((signature) => {
        const previewStyle = signature.position
          ? mapPdfPositionToPreview(signature.position)
          : { left: '60%', top: '75%', width: '20%', height: '10%' }

        return (
          <div
            key={signature.id}
            className="absolute pointer-events-auto"
            style={previewStyle}
            draggable
            onDragStart={onDragStart(`signature-${signature.id}`)}
            onDrop={onDrop(`signature-${signature.id}`)}
          >
            <img src={signature.url} alt="Signature" className="w-full h-full object-contain" />
            <div
              className="absolute bottom-0 right-0 cursor-nwse-resize bg-purple-500 rounded-full"
              style={{ width: '12px', height: '12px' }}
              onMouseDown={(e) => onResizeStart(e, `signature-${signature.id}`, 'se')}
            />
          </div>
        )
      })}

      {/* QR Code */}
      {enabledElements.qr && (
        <div
          className="absolute pointer-events-auto bg-gray-200 flex items-center justify-center text-xs text-gray-600"
          style={getElementStyle('qr', elementPositions.qr)}
          draggable
          onDragStart={onDragStart('qr')}
          onDrop={onDrop('qr')}
        >
          [QR Code]
          <div
            className="absolute bottom-0 right-0 cursor-nwse-resize bg-blue-500 rounded-full"
            style={{ width: '12px', height: '12px' }}
            onMouseDown={(e) => onResizeStart(e, 'qr', 'se')}
          />
        </div>
      )}

      {/* Certificate ID */}
      {enabledElements.certificateId && (
        <div
          className="absolute pointer-events-auto text-xs text-gray-500 justify-center flex items-center"
          style={getElementStyle('certificateId', elementPositions.certificateId)}
          draggable
          onDragStart={onDragStart('certificateId')}
          onDrop={onDrop('certificateId')}
        >
          Certificate ID: [XXXXXXXX]
          <div
            className="absolute bottom-0 right-0 cursor-nwse-resize bg-blue-500 rounded-full"
            style={{ width: '12px', height: '12px' }}
            onMouseDown={(e) => onResizeStart(e, 'certificateId', 'se')}
          />
        </div>
      )}
    </div>
  )
})

TemplatePreview.displayName = 'TemplatePreview'
