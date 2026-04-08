"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Camera, X } from "lucide-react"

interface QRScannerProps {
  onScan: (verificationId: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!isActive) return

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera access is not supported by this browser")
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.muted = true
          videoRef.current.play()
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to access camera"
        setError(message)
        onError?.(message)
        setIsActive(false)
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [isActive, onError])

  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const scanInterval = setInterval(async () => {
      if (!videoRef.current || !ctx) return

      try {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        const jsqrModule = await import("jsqr")
        const jsQR = (jsqrModule as any).default || jsqrModule
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code) {
          onScan(code.data)
          setIsActive(false)
          setError(null)
        }
      } catch (err) {
        console.error("[v0] QR scan error:", err)
      }
    }, 300)

    return () => clearInterval(scanInterval)
  }, [isActive, onScan])

  return (
    <div className="w-full space-y-4">
      {isActive ? (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Scanning QR Code
            </CardTitle>
            <CardDescription>Point camera at QR code on certificate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                width={320}
                height={240}
                className="hidden"
              />
              <div className="absolute inset-0 border-2 border-primary/50 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-primary rounded-lg opacity-75" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              onClick={() => setIsActive(false)}
              variant="outline"
              className="w-full"
            >
              <X className="w-4 h-4" />
              Cancel Scanning
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Button
          onClick={() => setIsActive(true)}
          className="w-full"
          variant="outline"
        >
          <Camera className="w-4 h-4" />
          Scan QR Code
        </Button>
      )}
    </div>
  )
}
