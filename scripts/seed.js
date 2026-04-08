import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error("MONGODB_URI env var is required")
  process.exit(1)
}

// Define schemas inline for the script
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  mobile: String,
  passwordHash: String,
  role: { type: String, enum: ["admin", "user"], default: "user" },
  orgName: String,
  orgLogo: String,
  phone: String,
}, { timestamps: true })

const TemplateSchema = new mongoose.Schema({
  name: String,
  description: String,
  layoutKey: String,
  fontStyle: { type: String, default: "serif" },
  primaryColor: { type: String, default: "#1e3a5f" },
  accentColor: { type: String, default: "#c8a45a" },
  logoUrl: String,
  signatureUrl: String,
  backgroundUrl: String,
  fields: [{ id: String, type: String, label: String, x: Number, y: Number, width: Number, height: Number, fontSize: Number, fontWeight: String, color: String, textAlign: String }],
  isDefault: { type: Boolean, default: false },
  createdByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true })

const ReviewSchema = new mongoose.Schema({
  name: String,
  role: String,
  organization: String,
  rating: Number,
  text: String,
  avatarUrl: String,
}, { timestamps: true })

const CandidateSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  eventName: String,
  status: { type: String, default: "pending" },
  createdByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true })

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log("Connected to MongoDB")

  const User = mongoose.models.User || mongoose.model("User", UserSchema)
  const Template = mongoose.models.Template || mongoose.model("Template", TemplateSchema)
  const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema)
  const Candidate = mongoose.models.Candidate || mongoose.model("Candidate", CandidateSchema)

  // Clear existing data (but preserve candidates)
  await User.deleteMany({})
  await Template.deleteMany({})
  await Review.deleteMany({})
  // await Candidate.deleteMany({}) // Commented out to preserve existing candidates
  console.log("Cleared existing data (preserved candidates)")

  // Create admin user
  const adminHash = await bcrypt.hash("Admin123!", 10)
  const admin = await User.create({
    name: "Admin User",
    email: "admin@certify.com",
    mobile: "+1234567890",
    passwordHash: adminHash,
    role: "admin",
    orgName: "CertifyPro Institution",
  })
  console.log("Created admin user:", admin.email)

  // Create regular user
  const userHash = await bcrypt.hash("User123!", 10)
  const user = await User.create({
    name: "Jane Smith",
    email: "user@certify.com",
    mobile: "+0987654321",
    passwordHash: userHash,
    role: "user",
  })
  console.log("Created regular user:", user.email)

  // Create templates
  await Template.create([
    {
      name: "Classic Elegance",
      description: "A timeless design with ornate borders and serif typography",
      layoutKey: "classic",
      fontStyle: "serif",
      primaryColor: "#1B2A4A",
      accentColor: "#C8A45A",
      fields: [],
      customFields: [],
      elementPositions: {
        title: { x: 50, y: 20, width: 80, height: 10 },
        description: { x: 50, y: 35, width: 80, height: 5 },
        candidateName: { x: 50, y: 50, width: 80, height: 8 },
        eventName: { x: 50, y: 65, width: 80, height: 6 },
        logo: { x: 10, y: 10, width: 15, height: 10 },
        signature: { x: 70, y: 80, width: 20, height: 8 },
      },
      isDefault: true,
      createdByAdminId: admin._id,
    },
    {
      name: "Modern Professional",
      description: "Clean, contemporary layout with bold accent elements",
      layoutKey: "modern",
      fontStyle: "sans-serif",
      primaryColor: "#0F172A",
      accentColor: "#3B82F6",
      fields: [],
      customFields: [],
      elementPositions: {
        title: { x: 50, y: 20, width: 80, height: 10 },
        description: { x: 50, y: 35, width: 80, height: 5 },
        candidateName: { x: 50, y: 50, width: 80, height: 8 },
        eventName: { x: 50, y: 65, width: 80, height: 6 },
        logo: { x: 10, y: 10, width: 15, height: 10 },
        signature: { x: 70, y: 80, width: 20, height: 8 },
      },
      isDefault: false,
      createdByAdminId: admin._id,
    },
    {
      name: "Elegant Certificate",
      description: "Sophisticated design with gold accents",
      layoutKey: "elegant",
      fontStyle: "serif",
      primaryColor: "#1f2937",
      accentColor: "#d4af37",
      fields: [],
      customFields: [],
      elementPositions: {
        title: { x: 50, y: 20, width: 80, height: 10 },
        description: { x: 50, y: 35, width: 80, height: 5 },
        candidateName: { x: 50, y: 50, width: 80, height: 8 },
        eventName: { x: 50, y: 65, width: 80, height: 6 },
        logo: { x: 10, y: 10, width: 15, height: 10 },
        signature: { x: 70, y: 80, width: 20, height: 8 },
      },
      isDefault: false,
      createdByAdminId: admin._id,
    },
  ])
  console.log("Created 3 templates")

  // Create candidates (commented out to preserve existing candidates)
  // await Candidate.create([
  //   { name: "Alice Johnson", email: "alice@example.com", mobile: "+1111111111", eventName: "Web Development Workshop", createdByAdminId: admin._id },
  //   { name: "Bob Williams", email: "bob@example.com", mobile: "+2222222222", eventName: "Web Development Workshop", createdByAdminId: admin._id },
  //   { name: "Charlie Brown", email: "charlie@example.com", mobile: "+3333333333", eventName: "Data Science Bootcamp", createdByAdminId: admin._id },
  //   { name: "Diana Prince", email: "diana@example.com", mobile: "+4444444444", eventName: "Data Science Bootcamp", createdByAdminId: admin._id },
  //   { name: "Eve Adams", email: "eve@example.com", mobile: "+5555555555", eventName: "Cloud Computing Seminar", createdByAdminId: admin._id },
  // ])
  console.log("Preserved existing candidates (did not create sample candidates)")

  // Create reviews
  await Review.create([
    {
      name: "Dr. Sarah Mitchell",
      role: "Dean of Engineering",
      organization: "Tech University",
      rating: 5,
      text: "CertifyPro has completely transformed how we manage certificates for our graduating students. The bulk generation feature saves us weeks of manual work.",
    },
    {
      name: "Rajesh Kumar",
      role: "Training Director",
      organization: "Global Skills Academy",
      rating: 5,
      text: "The QR verification feature gives our certificates instant credibility. Our partner companies can verify any certificate in seconds.",
    },
    {
      name: "Maria Gonzalez",
      role: "Event Coordinator",
      organization: "Digital Conferences Inc.",
      rating: 4,
      text: "We issue thousands of certificates per event. CertifyPro handles the scale effortlessly with beautiful, professional templates.",
    },
    {
      name: "James Chen",
      role: "HR Manager",
      organization: "Innovate Corp",
      rating: 5,
      text: "The email delivery system ensures every participant receives their certificate immediately. Excellent platform for corporate training programs.",
    },
    {
      name: "Aisha Patel",
      role: "Program Manager",
      organization: "Code Academy",
      rating: 5,
      text: "From bootcamps to workshops, CertifyPro handles all our certification needs. The template designer lets us match our brand perfectly.",
    },
  ])
  console.log("Created 5 reviews")

  // Link user to a candidate with same email if exists
  void user

  console.log("\nSeed complete!")
  console.log("Admin login: admin@certify.com / Admin123!")
  console.log("User login: user@certify.com / User123!")

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed error:", err)
  process.exit(1)
})
