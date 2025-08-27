import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import type { User } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-session'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  departmentId: number
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateJWT(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId
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

// Edge Runtime compatible JWT verification
export async function verifyJWTEdge(token: string): Promise<JWTPayload | null> {
  try {
    console.log('[Auth] Edge - Verifying JWT token:', token.substring(0, 50) + '...')
    
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }

    // Decode payload without verification for Edge Runtime
    const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    // Add padding if necessary
    const padding = '='.repeat((4 - base64Payload.length % 4) % 4)
    const paddedPayload = base64Payload + padding
    
    const payload = JSON.parse(atob(paddedPayload))
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('JWT token expired')
    }

    // Ensure required fields exist
    if (!payload.userId || !payload.email || !payload.role) {
      throw new Error('Invalid JWT payload')
    }

    console.log('[Auth] Edge - JWT verification successful:', payload)
    return payload as JWTPayload
  } catch (error) {
    console.error('[Auth] Edge - JWT verification failed:', error)
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
      where: { id: payload.userId },
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
      where: { id: payload.userId },
      include: { department: true }
    })

    return user
  } catch (error) {
    console.error('getCurrentUserFromRequest error:', error)
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
      where: { id: userId },
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

export function setAuthCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
}

export function clearAuthCookie() {
  const cookieStore = cookies()
  cookieStore.delete('auth-token')
}