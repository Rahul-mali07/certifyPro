import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me"
)

export interface AuthUser {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  organizationId?: string
  orgName?: string
}

export async function createToken(user: AuthUser): Promise<string> {
  return new SignJWT({ 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    role: user.role,
    organizationId: user.organizationId,
    orgName: user.orgName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as AuthUser
  } catch {
    return null
  }
}

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth-token")?.value
  if (!token) return null
  return verifyToken(token)
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getSession()
  if (!user) throw new Error("Unauthorized")
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== "admin") throw new Error("Forbidden")
  return user
}
