import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/db"
import { User, Template, Candidate } from "@/lib/models"

export async function POST() {
  try {
    await connectDB()

    // Create admin user if not exists
    const existingAdmin = await User.findOne({ email: "admin@certify.com" })
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash("Admin123!", 10)
      await User.create({
        name: "Admin User",
        email: "admin@certify.com",
        passwordHash,
        role: "admin",
      })
    }

    // Create demo user if not exists
    const existingUser = await User.findOne({ email: "user@certify.com" })
    if (!existingUser) {
      const passwordHash = await bcrypt.hash("User123!", 10)
      await User.create({
        name: "Demo User",
        email: "user@certify.com",
        passwordHash,
        role: "user",
      })
    }

    // Create default templates if none exist
    const templateCount = await Template.countDocuments()
    if (templateCount === 0) {
      await Template.insertMany([
        {
          name: "Classic Elegant",
          description: "Traditional certificate design with decorative borders and serif typography",
          layoutKey: "classic",
          fontStyle: "serif",
          primaryColor: "#1e3a5f",
          accentColor: "#c8a45a",
          isDefault: true,
        },
        {
          name: "Modern Professional",
          description: "Clean, contemporary design with sans-serif fonts and bold accents",
          layoutKey: "modern",
          fontStyle: "sans-serif",
          primaryColor: "#1B2A4A",
          accentColor: "#2563EB",
          isDefault: false,
        },
        {
          name: "Academic Formal",
          description: "Formal academic style with double borders and traditional layout",
          layoutKey: "academic",
          fontStyle: "serif",
          primaryColor: "#1a1a2e",
          accentColor: "#b8860b",
          isDefault: false,
        },
      ])
    }

    // Create sample candidates if none exist
    const candidateCount = await Candidate.countDocuments()
    if (candidateCount === 0) {
      const admin = await User.findOne({ role: "admin" })
      if (admin) {
        await Candidate.insertMany([
          {
            name: "Alice Johnson",
            email: "alice@example.com",
            mobile: "+1234567890",
            eventName: "Web Development Bootcamp 2024",
            status: "pending",
            createdByAdminId: admin._id,
          },
          {
            name: "Bob Smith",
            email: "bob@example.com",
            mobile: "+1234567891",
            eventName: "Web Development Bootcamp 2024",
            status: "pending",
            createdByAdminId: admin._id,
          },
          {
            name: "Charlie Brown",
            email: "charlie@example.com",
            eventName: "Data Science Workshop",
            status: "pending",
            createdByAdminId: admin._id,
          },
          {
            name: "Diana Prince",
            email: "diana@example.com",
            mobile: "+1234567893",
            eventName: "Data Science Workshop",
            status: "pending",
            createdByAdminId: admin._id,
          },
          {
            name: "Eve Wilson",
            email: "user@certify.com",
            eventName: "Cloud Computing Certification",
            status: "pending",
            createdByAdminId: admin._id,
          },
        ])
      }
    }

    return NextResponse.json({
      message: "Database seeded successfully",
      seeded: true,
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json({ error: "Seeding failed" }, { status: 500 })
  }
}
