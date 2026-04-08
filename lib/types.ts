export interface Candidate {
  _id: string
  name: string
  email: string
  mobile?: string
  eventName: string
  status: "pending" | "generated"
  certificateCount: number
  createdByAdminId?: string
  userId?: string
  customData?: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface Template {
  _id: string
  name: string
  description?: string
  layoutKey: string
  fontStyle: string
  primaryColor: string
  accentColor: string
  logoUrl?: string
  signatureUrl?: string
  backgroundUrl?: string
  templateFileUrl?: string
  logos?: Array<{
    id: string
    url: string
    position?: { x: number; y: number; width: number; height: number }
  }>
  signatures?: Array<{
    id: string
    url: string
    position?: { x: number; y: number; width: number; height: number }
  }>
  signaturePosition?: {
    x: number
    y: number
    width: number
    height: number
  }
  logoPosition?: {
    x: number
    y: number
    width: number
    height: number
  }
  customFields?: Array<{
    id: string
    name: string
    placeholder: string
  }>
  fields?: Array<{
    id?: string
    type?: string
    label?: string
    x?: number
    y?: number
    width?: number
    height?: number
    fontSize?: number
    fontWeight?: string
    color?: string
    textAlign?: string
  }>
  elementPositions?: {
    title: { x: number; y: number; width: number; height: number }
    description: { x: number; y: number; width: number; height: number }
    candidateName: { x: number; y: number; width: number; height: number }
    eventName: { x: number; y: number; width: number; height: number }
    logo: { x: number; y: number; width: number; height: number }
    signature: { x: number; y: number; width: number; height: number }
  }
  enabledElements?: {
    title?: boolean
    description?: boolean
    candidateName?: boolean
    eventName?: boolean
    logo?: boolean
    signature?: boolean
  }
  elementSizes?: {
    title?: { fontSize: number; fontWeight?: string }
    description?: { fontSize: number }
    candidateName?: { fontSize: number; fontWeight?: string }
    eventName?: { fontSize: number }
    logo?: { width: number; height: number }
    signature?: { width: number; height: number }
    borderThickness?: number
    lineHeight?: number
    cornerSize?: number
  }
  isDefault: boolean
  createdByAdminId?: string
  createdAt: string
}

export interface Certificate {
  _id: string
  certificateId: string
  serialNumber: string
  verificationId: string
  candidateId: string
  userId?: string
  templateId: string
  eventName: string
  candidateName: string
  issueDate: string
  certificateData?: string
  qrCodeData?: string
  verificationUrl?: string
  template_name?: string
  createdAt: string
}

export interface DashboardStats {
  totalCandidates: number
  totalCertificates: number
  totalTemplates: number
  recentActivity: Array<{
    id: string
    action: string
    user_name: string
    created_at: string
    details?: string
  }>
  certificatesByMonth: Array<{
    month: string
    count: number
  }>
}

export interface Notification {
  _id: string
  type: "email" | "sms"
  recipient_email: string
  recipient_mobile?: string
  cert_code: string
  candidate_name: string
  status: "sent" | "failed" | "pending"
  sent_at: string
}

export interface Organization {
  _id: string
  name: string
  email: string
  logo?: string
  phone?: string
  address?: string
  website?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminCode {
  _id: string
  code: string
  organizationId: string
  organizationName: string
  description?: string
  usageCount: number
  maxUsage?: number
  isActive: boolean
  createdAt: string
  expiresAt?: string
}
