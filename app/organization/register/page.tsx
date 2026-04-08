"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Eye, EyeOff, Loader2, Copy, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function OrganizationRegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [adminCode, setAdminCode] = useState("")
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/organizations/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Registration failed")
        setLoading(false)
        return
      }

      setAdminCode(data.adminCode)
      setSuccess(true)
      toast.success("Organization registered successfully!")
    } catch {
      toast.error("Something went wrong")
      setLoading(false)
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(adminCode)
    setCopied(true)
    toast.success("Admin code copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-serif text-foreground">Registration Successful!</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your organization has been registered. Save your admin code below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">Your Admin Secret Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-lg font-semibold text-foreground">
                  {adminCode}
                </code>
                <Button variant="outline" size="icon" onClick={copyCode}>
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Important:</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>Share this code with admins who will manage certificates</li>
                <li>You can create more codes from your organization dashboard</li>
                <li>Login to manage your admin codes and track usage</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push("/organization/login")} className="w-full">
                Login to Organization Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push("/register")} className="w-full">
                Register as Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            <rect x="50" y="50" width="300" height="300" rx="20" stroke="currentColor" strokeWidth="0.5" className="text-primary-foreground" />
            <rect x="80" y="80" width="240" height="240" rx="15" stroke="currentColor" strokeWidth="0.5" className="text-primary-foreground" />
            <rect x="110" y="110" width="180" height="180" rx="10" stroke="currentColor" strokeWidth="0.5" className="text-primary-foreground" />
          </svg>
        </div>
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center">
              <Building2 className="w-8 h-8 text-accent-foreground" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-primary-foreground">CertifyPro</h1>
          </div>
          <h2 className="text-2xl font-semibold text-primary-foreground mb-4">For Organizations</h2>
          <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            Register your organization and create custom admin codes for your team members.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-left">
            <div className="bg-primary-foreground/10 rounded-lg p-4">
              <h3 className="font-semibold text-primary-foreground">Multi-Admin Support</h3>
              <p className="text-sm text-primary-foreground/70 mt-1">Create unlimited admin codes</p>
            </div>
            <div className="bg-primary-foreground/10 rounded-lg p-4">
              <h3 className="font-semibold text-primary-foreground">Usage Tracking</h3>
              <p className="text-sm text-primary-foreground/70 mt-1">Monitor code usage in real-time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-serif font-bold text-foreground">CertifyPro</span>
          </div>

          <Card className="border-0 shadow-none lg:shadow-md lg:border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-serif text-foreground">Register Organization</CardTitle>
              <CardDescription className="text-muted-foreground">
                Create an account to manage your organization&apos;s admin codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-foreground">Organization Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Acme Corporation" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-foreground">Organization Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@organization.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full mt-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register Organization"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already registered?{" "}
                <Link href="/organization/login" className="text-primary font-medium hover:underline">
                  Login here
                </Link>
              </div>
              <div className="mt-2 text-center text-sm text-muted-foreground">
                Want to register as admin?{" "}
                <Link href="/register" className="text-primary font-medium hover:underline">
                  Go to admin registration
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
