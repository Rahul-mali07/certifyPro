"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Mail, Smartphone, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

interface CertificateDeliveryDialogProps {
  initialSelectedCertificateIds?: string[]
  disabled?: boolean
}

export function CertificateDeliveryDialog({ initialSelectedCertificateIds = [], disabled = false }: CertificateDeliveryDialogProps) {
  const [open, setOpen] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState("email")
  const [selectedCertIds, setSelectedCertIds] = useState<string[]>(initialSelectedCertificateIds)
  const [recipientEmail, setRecipientEmail] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setSelectedCertIds(initialSelectedCertificateIds)
  }, [initialSelectedCertificateIds])

  const handleDeliver = async () => {
    const certIds = selectedCertIds
    if (certIds.length === 0) {
      toast.error("Please select at least one certificate on the Certificates page")
      return
    }


    setLoading(true)
    try {
      const res = await fetch("/api/admin/certificates/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateIds: certIds,
          deliveryMethod,
          recipientEmail: deliveryMethod === "email" ? recipientEmail : undefined,
          recipientPhone: deliveryMethod === "sms" ? recipientPhone : undefined,
        }),
      })

      if (!res.ok) throw new Error()
      setSuccess(true)
      toast.success(`Certificates delivered via ${deliveryMethod}`)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setSelectedCertIds([])
        setRecipientEmail("")
        setRecipientPhone("")
      }, 2000)
    } catch {
      toast.error("Failed to deliver certificates")
    }
    setLoading(false)
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button disabled={disabled}>
            <Mail className="w-4 h-4" />
            Send Certificates
          </Button>
        </DialogTrigger>
        <DialogContent>
          <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <h3 className="font-semibold text-lg">Delivery Successful!</h3>
            <p className="text-muted-foreground">Certificates have been sent successfully</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Mail className="w-4 h-4" />
          Send Certificates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deliver Certificates</DialogTitle>
          <DialogDescription>Choose how to deliver the selected certificates</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Delivery Method</Label>
            <p className="text-sm text-muted-foreground">
              Sending {selectedCertIds.length} certificate{selectedCertIds.length === 1 ? "" : "s"} selected on the Certificates page.
            </p>
          </div>

          {/* Delivery Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Delivery Method</Label>
            <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <div className="space-y-3">

                <div className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted"
                  onClick={() => setDeliveryMethod("email")}>
                  <RadioGroupItem value="email" id="method-email" className="mt-1" />
                  <div className="flex-1 cursor-pointer">
                    <label htmlFor="method-email" className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      <span>Send via Email</span>
                    </label>
                    {deliveryMethod === "email" && (
                      <>
                        <Input
                          placeholder="recipient@example.com"
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Optional if selected candidates already have saved email addresses.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted"
                  onClick={() => setDeliveryMethod("sms")}>
                  <RadioGroupItem value="sms" id="method-sms" className="mt-1" />
                  <div className="flex-1 cursor-pointer">
                    <label htmlFor="method-sms" className="flex items-center gap-2 mb-2">
                      <Smartphone className="w-4 h-4" />
                      <span>Send via SMS</span>
                    </label>
                    {deliveryMethod === "sms" && (
                      <>
                        <Input
                          placeholder="+1 (555) 000-0000"
                          type="tel"
                          value={recipientPhone}
                          onChange={(e) => setRecipientPhone(e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Optional if selected candidates already have saved phone numbers.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleDeliver} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Deliver Certificates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
