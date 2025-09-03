import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import type { User } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
void (process.env.SESSION_SECRET || 'fallback-session') // Reserved for future session handling

export interface JWTPayload {
  userId: string
  email: string
  // role: removed - will be fetched from DB for real-time updates
  // departmentId: removed - will be fetched from DB for real-time updates
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateJWT(user: User): string {
  const payload: JWTPayload = {
    userId: String(user.id),
    email: user.email
    // role and departmentId removed - will be fetched from DB for security
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    console.log('[Auth] Verifying JWT token:', token.substring(0, 50) + '...')
    console.log('[Auth] Using JWT_SECRET:', JWT_SECRET.substring(0, 10) + '...')
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload
    console.log('[Auth] JWT verification successful:', payload)
    return payload
  } catch (error) {
    console.error('[Auth] JWT verification failed:', error)
    return null
  }
}

// Edge Runtime compatible JWT verification with proper signature verification
export async function verifyJWTEdge(token: string): Promise<JWTPayload | null> {
  try {
    console.log('[Auth] Edge - Verifying JWT token:', token.substring(0, 50) + '...')
    
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }

    const [header, payload, signature] = parts
    
    // Verify signature using Web Crypto API (Edge Runtime compatible)
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    
    const data = new TextEncoder().encode(`${header}.${payload}`)
    const signatureBytes = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      data
    )
    
    if (!isValid) {
      throw new Error('Invalid JWT signature')
    }

    // Decode payload
    const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padding = '='.repeat((4 - base64Payload.length % 4) % 4)
    const paddedPayload = base64Payload + padding
    
    const decodedPayload = JSON.parse(atob(paddedPayload))
    
    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('JWT token expired')
    }

    // Ensure required fields exist
    if (!decodedPayload.userId || !decodedPayload.email) {
      throw new Error('Invalid JWT payload')
    }

    console.log('[Auth] Edge - JWT verification successful:', decodedPayload)
    return decodedPayload as JWTPayload
  } catch (error) {
    console.error('[Auth] Edge - JWT verification failed:', error)
    return null
  }
}

// Enhanced JWT verification with DB validation for critical operations
export async function verifyJWTWithDB(token: string): Promise<{ payload: JWTPayload, user: User } | null> {
  try {
    // First verify the JWT token itself
    const payload = await verifyJWTEdge(token)
    if (!payload) {
      console.log('[Auth] JWT token verification failed')
      return null
    }

    // Get current user data from database
    const user = await prisma.user.findUnique({
      where: { id: parseInt(payload.userId) },
      include: { department: true }
    })

    if (!user) {
      console.log('[Auth] User not found in database:', payload.userId)
      return null
    }

    // JWT now only contains userId and email - no role/departmentId to check
    // Always return user data from DB for real-time role updates

    console.log('[Auth] JWT/DB validation successful for user:', payload.userId)
    return { payload, user }
  } catch (error) {
    console.error('[Auth] JWT/DB verification error:', error)
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(payload.userId) },
      include: { department: true }
    })

    return user
  } catch {
    return null
  }
}

export async function getCurrentUserFromRequest(request: Request): Promise<User | null> {
  try {
    const cookieHeader = request.headers.get('cookie')
    
    if (!cookieHeader) {
      return null
    }

    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    const token = cookies['auth-token']
    if (!token) {
      return null
    }

    const payload = verifyJWT(token)
    
    if (!payload) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(payload.userId) },
      include: { department: true }
    })

    return user
  } catch (error) {
    console.error('getCurrentUserFromRequest error:', error)
    return null
  }
}

// Generate a new JWT with fresh user data from database
export async function refreshUserToken(userId: number): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: true }
    })

    if (!user) {
      console.log('[Auth] User not found for token refresh:', userId)
      return null
    }

    console.log('[Auth] Generating fresh JWT for user:', {
      userId: user.id,
      email: user.email
      // role and departmentId will be fetched from DB when needed
    })

    return generateJWT(user)
  } catch (error) {
    console.error('[Auth] Token refresh error:', error)
    return null
  }
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: true }
    })

    if (!user || !user.passwordHash) {
      return null
    }

    // Check if user is set up for password authentication
    if (user.authType !== 'PASSWORD') {
      return null
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return null
    }

    return user
  } catch {
    return null
  }
}

export async function findUserByEntraId(entraId: string): Promise<User | null> {
  try {
    const user = await prisma.user.findFirst({
      where: { entraId },
      include: { department: true }
    })

    return user
  } catch {
    return null
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: true }
    })

    return user
  } catch {
    return null
  }
}

export async function updateUserEntraId(userId: string, entraId: string): Promise<User | null> {
  try {
    const user = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { 
        entraId,
        authType: 'ENTRA_ID'
      },
      include: { department: true }
    })

    return user
  } catch {
    return null
  }
}

export async function createUser(
  email: string,
  name: string,
  password: string,
  departmentId: number,
  role: 'DEPARTMENT_USER' | 'MANAGEMENT_USER'
): Promise<User> {
  const passwordHash = await hashPassword(password)
  
  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      departmentId,
      role,
      authType: 'PASSWORD'
    },
    include: { department: true }
  })
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

// Helper function to get current user from request headers (for API routes)
export async function getUserFromHeaders(request: NextRequest): Promise<User | null> {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { department: true }
    })

    console.log('[Auth] User fetched from DB via headers:', {
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      departmentId: user?.departmentId
    })

    return user
  } catch (error) {
    console.error('[Auth] Failed to get user from headers:', error)
    return null
  }
}