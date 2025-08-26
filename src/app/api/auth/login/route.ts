import { NextRequest, NextResponse } from 'next/server'
import Joi from 'joi'
import { loginUser, generateJWT, setAuthCookie } from '@/lib/auth'

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { error, value } = loginSchema.validate(body)
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.details },
        { status: 400 }
      )
    }

    const { email, password } = value
    const user = await loginUser(email, password)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const token = generateJWT(user)
    console.log('[Login] Generated token:', token.substring(0, 50) + '...')
    
    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      }
    })

    // Set the authentication cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
    
    console.log('[Login] Cookie settings:', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}