import { NextRequest, NextResponse } from 'next/server'
import { generateJWT } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ENTRA_ID_CONFIG = {
  clientId: process.env.ENTRA_ID_CLIENT_ID!,
  tenantId: process.env.ENTRA_ID_TENANT_ID!,
  redirectUri: process.env.ENTRA_ID_REDIRECT_URI!,
  clientSecret: process.env.ENTRA_ID_CLIENT_SECRET!
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  id_token: string
}

interface UserInfo {
  id: string
  userPrincipalName: string
  displayName: string
  mail: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('Entra ID auth error:', error)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=entra_id_error`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=invalid_callback`)
    }

    // Validate state parameter
    const storedState = request.cookies.get('entra-auth-state')?.value
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=invalid_state`)
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${ENTRA_ID_CONFIG.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: ENTRA_ID_CONFIG.clientId,
          client_secret: ENTRA_ID_CONFIG.clientSecret,
          code: code,
          redirect_uri: ENTRA_ID_CONFIG.redirectUri,
          grant_type: 'authorization_code'
        })
      }
    )

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=token_exchange_failed`)
    }

    const tokenData: TokenResponse = await tokenResponse.json()

    // Get user information from Microsoft Graph
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    if (!userResponse.ok) {
      console.error('User info fetch failed:', await userResponse.text())
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=user_info_failed`)
    }

    const userInfo: UserInfo = await userResponse.json()

    // Find or create user in database
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { entraId: userInfo.id },
          { email: userInfo.mail || userInfo.userPrincipalName }
        ]
      },
      include: { department: true }
    })

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?error=user_not_found&email=${encodeURIComponent(userInfo.mail || userInfo.userPrincipalName)}`
      )
    }

    // Update user's Entra ID if not set
    if (!user.entraId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          entraId: userInfo.id,
          authType: 'ENTRA_ID'
        },
        include: { department: true }
      })
    }

    // Generate JWT token
    const token = generateJWT(user)

    // Create response and set cookie
    const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard`)
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    // Clear state cookie
    response.cookies.delete('entra-auth-state')

    return response
  } catch (error) {
    console.error('Entra ID callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=callback_error`)
  }
}