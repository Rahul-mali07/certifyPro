import mongoose, { Schema, Document, Model } from "mongoose"

// ── User ──
export interface IUser extends Document {
  name: string
  email: string
  mobile?: string
  passwordHash: string
  role: "admin" | "user"
  organizationId?: mongoose.Types.ObjectId
  orgName?: string
  orgLogo?: string
  phone?: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    orgName: { type: String },
    orgLogo: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
)

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

// ── Candidate ──
export interface ICandidate extends Document {
  name: string
  email: string
  mobile?: string
  eventName: string
  status: "pending" | "generated"
  certificateCount: number
  createdByAdminId: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId
  customData?: Record<string, string>
  createdAt: Date
  updatedAt: Date
}

const CandidateSchema = new Schema<ICandidate>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String },
    eventName: { type: String, required: true },
    status: { type: String, enum: ["pending", "generated"], default: "pending" },
    certificateCount: { type: Number, default: 0 },
    createdByAdminId: { type: Schema.Types.ObjectId, ref: "User" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    customData: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

export const Candidate: Model<ICandidate> =
  mongoose.models.Candidate || mongoose.model<ICandidate>("Candidate", CandidateSchema)

// ── Template ──
export interface ITemplate extends Document {
  name: string
  description?: string
  layoutKey: string
  fontStyle: string
  primaryColor: string
  accentColor: string
  logoUrl?: string
  signatureUrl?: string
  logos?: Array<{
    id: string
    url: string
    position?: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  signatures?: Array<{
    id: string
    url: string
    position?: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  signaturePosition?: {
    x: number
    y: number
    width: number
    height: number
  }
  backgroundUrl?: string
  fields: Array<{
    id: string
    type: string
    label: string
    x: number
    y: number
    width: number
    height: number
    fontSize?: number
    fontWeight?: string
    color?: string
    textAlign?: string
  }>
  customFields?: Array<{
    id: string
    name: string
    placeholder: string
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
  createdByAdminId?: mongoose.Types.ObjectId
  createdAt: Date
}

const TemplateFieldSchema = new Schema(
  {
    id: String,
    type: String,
    label: String,
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    fontSize: Number,
    fontWeight: String,
    color: String,
    textAlign: String,
  },
  { _id: false }
)

const SignaturePositionSchema = new Schema(
  {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
  },
  { _id: false }
)

const LogoPositionSchema = new Schema(
  {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
  },
  { _id: false }
)

const CustomFieldSchema = new Schema(
  {
    id: String,
    name: String,
    placeholder: String,
  },
  { _id: false }
)

const ElementPositionSchema = new Schema(
  {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
  },
  { _id: false }
)

const ElementPositionsSchema = new Schema(
  {
    title: ElementPositionSchema,
    description: ElementPositionSchema,
    candidateName: ElementPositionSchema,
    eventName: ElementPositionSchema,
    logo: ElementPositionSchema,
    signature: ElementPositionSchema,
  },
  { _id: false }
)

const EnabledElementsSchema = new Schema(
  {
    title: { type: Boolean, default: true },
    description: { type: Boolean, default: true },
    candidateName: { type: Boolean, default: true },
    eventName: { type: Boolean, default: true },
    logo: { type: Boolean, default: true },
    signature: { type: Boolean, default: true },
  },
  { _id: false }
)

const ElementSizesSchema = new Schema(
  {
    title: {
      fontSize: { type: Number, default: 48 },
      fontWeight: { type: String, default: 'bold' },
    },
    description: {
      fontSize: { type: Number, default: 14 },
    },
    candidateName: {
      fontSize: { type: Number, default: 40 },
      fontWeight: { type: String, default: 'bold' },
    },
    eventName: {
      fontSize: { type: Number, default: 24 },
    },
    logo: {
      width: { type: Number, default: 100 },
      height: { type: Number, default: 100 },
    },
    signature: {
      width: { type: Number, default: 150 },
      height: { type: Number, default: 60 },
    },
    borderThickness: { type: Number, default: 3 },
    lineHeight: { type: Number, default: 1.5 },
    cornerSize: { type: Number, default: 20 },
  },
  { _id: false }
)

const TemplateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true },
    description: { type: String },
    layoutKey: { type: String, required: true },
    fontStyle: { type: String, default: "serif" },
    primaryColor: { type: String, default: "#1e3a5f" },
    accentColor: { type: String, default: "#c8a45a" },
    logoUrl: { type: String },
    logoPosition: LogoPositionSchema,
    logos: [{
      id: { type: String },
      url: { type: String },
      position: {
        x: { type: Number },
        y: { type: Number },
        width: { type: Number },
        height: { type: Number },
      }
    }],
    signatureUrl: { type: String },
    signaturePosition: SignaturePositionSchema,
    signatures: [{
      id: { type: String },
      url: { type: String },
      position: {
        x: { type: Number },
        y: { type: Number },
        width: { type: Number },
        height: { type: Number },
      }
    }],
    backgroundUrl: { type: String },
    templateFileUrl: { type: String },
    fields: [TemplateFieldSchema],
    customFields: [CustomFieldSchema],
    elementPositions: ElementPositionsSchema,
    enabledElements: EnabledElementsSchema,
    elementSizes: ElementSizesSchema,
    isDefault: { type: Boolean, default: false },
    createdByAdminId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
)

export const Template: Model<ITemplate> =
  mongoose.models.Template || mongoose.model<ITemplate>("Template", TemplateSchema)

// ── Certificate ──
export interface ICertificate extends Document {
  certificateId: string
  serialNumber: string
  verificationId: string
  candidateId: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId
  templateId: mongoose.Types.ObjectId
  eventName: string
  candidateName: string
  issueDate: Date
  certificateData?: string
  qrCodeData?: string
  qrCodeUrl?: string
  verificationUrl?: string
  generationInstance: number
  createdAt: Date
}

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateId: { type: String, required: true, unique: true },
    serialNumber: { type: String, required: true, unique: true },
    verificationId: { type: String, required: true, unique: true },
    candidateId: { type: Schema.Types.ObjectId, ref: "Candidate", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    templateId: { type: Schema.Types.ObjectId, ref: "Template", required: true },
    eventName: { type: String, required: true },
    candidateName: { type: String, required: true },
    issueDate: { type: Date, default: Date.now },
    certificateData: { type: String },
    qrCodeData: { type: String },
    qrCodeUrl: { type: String },
    verificationUrl: { type: String },
    generationInstance: { type: Number, default: 1 },
  },
  { timestamps: true }
)

export const Certificate: Model<ICertificate> =
  mongoose.models.Certificate || mongoose.model<ICertificate>("Certificate", CertificateSchema)

// ── Notification ──
export interface INotification extends Document {
  certificateId: mongoose.Types.ObjectId
  recipientEmail: string
  recipientMobile?: string
  type: "email" | "sms" | "download"
  status: "sent" | "failed" | "pending"
  deliveryMethod: "email" | "sms" | "download"
  certCode?: string
  candidateName?: string
  sentAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    certificateId: { type: Schema.Types.ObjectId, ref: "Certificate", required: true },
    recipientEmail: { type: String, required: true },
    recipientMobile: { type: String },
    type: { type: String, enum: ["email", "sms", "download"], default: "email" },
    status: { type: String, enum: ["sent", "failed", "pending"], default: "pending" },
    deliveryMethod: { type: String, enum: ["email", "sms", "download"], default: "email" },
    certCode: { type: String },
    candidateName: { type: String },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema)

// ── ActivityLog ──
export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId
  action: string
  details?: string
  userName?: string
  createdAt: Date
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    details: { type: String },
    userName: { type: String },
  },
  { timestamps: true }
)

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema)

// ── Review ──
export interface IReview extends Document {
  name: string
  role: string
  organization: string
  rating: number
  text: string
  avatarUrl?: string
  createdAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    organization: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true },
    avatarUrl: { type: String },
  },
  { timestamps: true }
)

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema)

// ── EmailLog ──
export interface IEmailLog extends Document {
  certificateId: mongoose.Types.ObjectId
  recipientEmail: string
  recipientName: string
  subject: string
  status: "sent" | "failed" | "pending"
  error?: string
  sentAt: Date
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    certificateId: { type: Schema.Types.ObjectId, ref: "Certificate", required: true },
    recipientEmail: { type: String, required: true },
    recipientName: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed", "pending"], default: "pending" },
    error: { type: String },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const EmailLog: Model<IEmailLog> =
  mongoose.models.EmailLog || mongoose.model<IEmailLog>("EmailLog", EmailLogSchema)

// ── Organization ──
export interface IOrganization extends Document {
  name: string
  email: string
  passwordHash: string
  logo?: string
  phone?: string
  address?: string
  website?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    logo: { type: String },
    phone: { type: String },
    address: { type: String },
    website: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Organization: Model<IOrganization> =
  mongoose.models.Organization || mongoose.model<IOrganization>("Organization", OrganizationSchema)

// ── AdminCode ──
export interface IAdminCode extends Document {
  code: string
  organizationId: mongoose.Types.ObjectId
  organizationName: string
  description?: string
  usageCount: number
  maxUsage?: number
  isActive: boolean
  createdAt: Date
  expiresAt?: Date
}

const AdminCodeSchema = new Schema<IAdminCode>(
  {
    code: { type: String, required: true, unique: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    organizationName: { type: String, required: true },
    description: { type: String },
    usageCount: { type: Number, default: 0 },
    maxUsage: { type: Number },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
)

export const AdminCode: Model<IAdminCode> =
  mongoose.models.AdminCode || mongoose.model<IAdminCode>("AdminCode", AdminCodeSchema)
