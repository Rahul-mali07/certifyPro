"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<"user" | "admin">("user")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [adminSecretCode, setAdminSecretCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, mobile, password, role, adminSecretCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Registration failed")
        setLoading(false)
        return
      }

      toast.success("Account created successfully!")

      // Force refresh to update cookie state before navigation
      router.refresh()
      
      // Small delay to ensure cookies are set before redirect
      setTimeout(() => {
        if (data.user.role === "admin") {
          window.location.href = "/admin"
        } else {
          window.location.href = "/dashboard"
        }
      }, 100)
    } catch {
      toast.error("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="0.5" className="text-primary-foreground" />
            <circle cx="200" cy="200" r="140" stroke="currentColor" strokeWidth="0.5" className="text-primary-foreground" />
            <circle cx="200" cy="200" r="100" stroke="currentColor" strokeWidth="0.5" className="text-primary-foreground" />
          </svg>
        </div>
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center">
              <Award className="w-8 h-8 text-accent-foreground" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-primary-foreground">CertifyPro</h1>
          </div>
          <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
            Join thousands of institutions managing certificates effortlessly with CertifyPro.
          </p>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Award className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-serif font-bold text-foreground">CertifyPro</span>
          </div>

          <Card className="border-0 shadow-none lg:shadow-md lg:border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-serif text-foreground">Create an account</CardTitle>
              <CardDescription className="text-muted-foreground">Choose your role and get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={role} onValueChange={(v) => setRole(v as "user" | "admin")} className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="user">User / Candidate</TabsTrigger>
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                </TabsList>
                <TabsContent value="admin">
                  <p className="text-xs text-muted-foreground p-2 rounded bg-muted">
                    Admin registration requires a secret code provided by your organization.
                  </p>
                </TabsContent>
              </Tabs>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name" className="text-foreground">Full Name</Label>
                  <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="mobile" className="text-foreground">Mobile (optional)</Label>
                  <Input id="mobile" type="tel" placeholder="+1 234 567 890" value={mobile} onChange={(e) => setMobile(e.target.value)} />
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

                {role === "admin" && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="adminCode" className="text-foreground">Admin Secret Code</Label>
                    <Input
                      id="adminCode"
                      type="password"
                      placeholder="Enter admin secret code"
                      value={adminSecretCode}
                      onChange={(e) => setAdminSecretCode(e.target.value)}
                      required
                    />
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full mt-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </div>
              <div className="mt-2 text-center text-sm text-muted-foreground">
                Want to register your organization?{" "}
                <Link href="/organization/register" className="text-primary font-medium hover:underline">
                  Register Organization
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
