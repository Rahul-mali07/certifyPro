"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QRScanner } from "@/components/qr-scanner"
import {
  Award,
  Shield,
  Users,
  FileText,
  Search,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Star,
  ChevronLeft,
  ChevronRight,
  Quote,
} from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "PDF Generation",
    description: "Generate professional certificates as PDF files with customizable templates and layouts.",
  },
  {
    icon: QrCode,
    title: "QR Verification",
    description: "Each certificate includes a unique QR code linking to an instant public verification page.",
  },
  {
    icon: Users,
    title: "Bulk Management",
    description: "Import candidates via CSV, manage them easily, and generate certificates in bulk with one click.",
  },
  {
    icon: Shield,
    title: "Secure & Verifiable",
    description: "Unique certificate IDs, role-based access, and a public verification portal for authenticity checks.",
  },
]

const steps = [
  { step: "01", title: "Add Candidates", description: "Import candidates individually or in bulk via CSV upload" },
  { step: "02", title: "Choose Template", description: "Select from professional pre-built certificate templates" },
  { step: "03", title: "Generate & Distribute", description: "Generate PDFs in bulk and notify candidates automatically" },
]

const reviews = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Dean of Students",
    organization: "Stanford University",
    rating: 5,
    text: "CertifyPro has transformed how we manage student certificates. The bulk generation and verification features save us countless hours every semester.",
  },
  {
    name: "James Rodriguez",
    role: "Training Director",
    organization: "Microsoft Learning",
    rating: 5,
    text: "The QR code verification is a game-changer. Our partners can instantly verify certificates without any back-and-forth emails.",
  },
  {
    name: "Emily Chen",
    role: "HR Manager",
    organization: "Deloitte",
    rating: 5,
    text: "We process thousands of certificates annually. CertifyPro's CSV import and bulk generation made our workflow incredibly efficient.",
  },
  {
    name: "Prof. Michael Brown",
    role: "Academic Director",
    organization: "MIT OpenCourseWare",
    rating: 5,
    text: "The professional templates and customization options perfectly match our brand identity. Highly recommended for educational institutions.",
  },
  {
    name: "Priya Sharma",
    role: "Events Coordinator",
    organization: "Google Developer Groups",
    rating: 5,
    text: "From hackathons to workshops, CertifyPro handles all our certificate needs. The platform is intuitive and the support is excellent.",
  },
]

export default function LandingPage() {
  const router = useRouter()
  const [certId, setCertId] = useState("")
  const [currentReview, setCurrentReview] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentReview((prev) => (prev + 1) % reviews.length)
      }, 5000)
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [isAutoPlaying])

  function nextReview() {
    setIsAutoPlaying(false)
    setCurrentReview((prev) => (prev + 1) % reviews.length)
  }

  function prevReview() {
    setIsAutoPlaying(false)
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length)
  }

  function normalizeVerificationId(value: string) {
    const trimmed = value.trim()
    try {
      const url = new URL(trimmed, window.location.origin)
      const segments = url.pathname.split("/").filter(Boolean)
      const verifyIndex = segments.indexOf("verify")
      if (verifyIndex !== -1 && segments.length > verifyIndex + 1) {
        return segments[verifyIndex + 1]
      }
    } catch {
      // not a valid URL
    }

    const idMatch = trimmed.match(/(CERT-[A-Z0-9]{8})$/i)
    if (idMatch) {
      return idMatch[1].toUpperCase()
    }

    return trimmed
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (certId.trim()) {
      router.push(`/verify/${certId.trim()}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Award className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-serif font-bold text-foreground">CertifyPro</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium mb-6">
            <CheckCircle2 className="w-4 h-4" />
            Trusted Certificate Platform
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight text-balance">
            Professional Certificate Generation & Management
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
            Create, manage, and verify certificates effortlessly. From single events to large-scale programs, CertifyPro handles it all with elegant PDF generation and instant verification.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Start Generating
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#verify">Verify a Certificate</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-muted/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-foreground">Everything You Need</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">A complete platform for certificate lifecycle management</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-card">
                <CardContent className="pt-6">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-foreground">How It Works</h2>
            <p className="mt-3 text-muted-foreground">Three simple steps to professional certificates</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-5xl font-serif font-bold text-primary/20 mb-3">{s.step}</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 px-6 bg-muted/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-foreground">What Our Users Say</h2>
            <p className="mt-3 text-muted-foreground">Trusted by leading institutions and organizations worldwide</p>
          </div>
          
          <div className="relative">
            {/* Review Card */}
            <Card className="bg-card overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <Quote className="w-12 h-12 text-primary/20 mb-6" />
                <div className="min-h-[120px]">
                  <p className="text-lg md:text-xl text-foreground leading-relaxed italic">
                    &ldquo;{reviews[currentReview].text}&rdquo;
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <div>
                    <div className="flex gap-1 mb-2">
                      {[...Array(reviews[currentReview].rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="font-semibold text-foreground">{reviews[currentReview].name}</p>
                    <p className="text-sm text-muted-foreground">
                      {reviews[currentReview].role}, {reviews[currentReview].organization}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={prevReview} aria-label="Previous review">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextReview} aria-label="Next review">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false)
                    setCurrentReview(index)
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentReview ? "bg-primary" : "bg-primary/20"
                  }`}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Verify Section */}
      <section id="verify" className="py-16 px-6 bg-primary/5">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-6">
              <Search className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-foreground">Verify a Certificate</h2>
            <p className="mt-3 text-muted-foreground">
              Check certificate authenticity using ID or QR code
            </p>
          </div>

          <Card className="bg-card">
            <CardContent className="p-6">
              <Tabs defaultValue="search" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="search" className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Search</span>
                  </TabsTrigger>
                  <TabsTrigger value="qr" className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    <span className="hidden sm:inline">QR Code</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="search" className="space-y-3">
                  <form onSubmit={handleVerify} className="flex gap-3">
                    <Input
                      placeholder="e.g., CERT-A1B2C3D4"
                      value={certId}
                      onChange={(e) => setCertId(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!certId.trim()}>
                      Verify
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="qr" className="space-y-3">
                  <QRScanner onScan={(verificationId) => {
                    const certIdFromQr = normalizeVerificationId(verificationId)
                    router.push(`/verify/${certIdFromQr}`)
                  }} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
              <Award className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-serif font-bold text-foreground">CertifyPro</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Certificate Generation & Management Platform
          </p>
          <div className="flex gap-4 text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
