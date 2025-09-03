import { NextResponse } from 'next/server'

const ENTRA_ID_CONFIG = {
  clientId: process.env.ENTRA_ID_CLIENT_ID!,
  tenantId: process.env.ENTRA_ID_TENANT_ID!,
  redirectUri: process.env.ENTRA_ID_REDIRECT_URI!,
  clientSecret: process.env.ENTRA_ID_CLIENT_SECRET!
}

export async function GET() {
  try {
    // Check if all required environment variables are set
    if (!ENTRA_ID_CONFIG.clientId || !ENTRA_ID_CONFIG.tenantId || !ENTRA_ID_CONFIG.redirectUri) {
      return NextResponse.json(
        { success: false, error: 'Entra ID configuration is missing' },
        { status: 500 }
      )
    }

    // Generate state parameter for CSRF protection
    const state = crypto.randomUUID()
    
    // Store state in session (in production, use proper session storage)
    const response = NextResponse.redirect(
      `https://login.microsoftonline.com/${ENTRA_ID_CONFIG.tenantId}/oauth2/v2.0/authorize?` +
      new URLSearchParams({
        client_id: ENTRA_ID_CONFIG.clientId,
        response_type: 'code',
        redirect_uri: ENTRA_ID_CONFIG.redirectUri,
        scope: 'openid profile email User.Read',
        state: state,
        prompt: 'select_account'
      }).toString()
    )

    // Set state cookie for validation
    response.cookies.set('entra-auth-state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Entra ID auth initiation error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication initiation failed' },
      { status: 500 }
    )
  }
}