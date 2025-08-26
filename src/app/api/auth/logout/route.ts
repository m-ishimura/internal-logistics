import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })
    
    // Clear the authentication cookie
    response.cookies.delete('auth-token')
    
    // Also explicitly set expired cookie
    response.cookies.set('auth-token', '', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}