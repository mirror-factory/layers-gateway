import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    // Determine redirect URL
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';

    let redirectUrl: string;
    if (isLocalEnv) {
      redirectUrl = `${request.nextUrl.origin}${next}`;
    } else if (forwardedHost) {
      redirectUrl = `https://${forwardedHost}${next}`;
    } else {
      redirectUrl = `${request.nextUrl.origin}${next}`;
    }

    // Create response first
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            console.log('[OAuth Callback] setAll called with', cookiesToSet.length, 'cookies');
            cookiesToSet.forEach(({ name, value, options }) => {
              console.log('[OAuth Callback] Setting cookie:', name);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // SECURITY: Log user ID, not email (GDPR compliance)
    console.log('[OAuth Callback] Code exchange result:', {
      success: !error,
      error: error?.message,
      hasSession: !!data?.session,
      userId: data?.user?.id,
    });

    if (!error && data.session) {
      // Check if setAll was called by looking for Set-Cookie header
      let cookieHeader = response.headers.get('set-cookie');

      if (!cookieHeader) {
        // setAll wasn't called - explicitly set the session to trigger it
        console.log('[OAuth Callback] setAll was not called, explicitly setting session');

        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (setSessionError) {
          console.error('[OAuth Callback] setSession error:', setSessionError);
        }

        cookieHeader = response.headers.get('set-cookie');
      }

      console.log('[OAuth Callback] Final Set-Cookie header:', cookieHeader ? 'present' : 'missing');

      // If still no cookies, fall back to manual cookie setting
      if (!cookieHeader) {
        console.log('[OAuth Callback] Falling back to manual cookie setting');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1] || 'supabase';

        // Supabase SSR stores session as JSON in cookies (potentially chunked)
        const sessionData = JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          expires_in: data.session.expires_in,
          token_type: data.session.token_type,
          user: data.session.user,
        });

        // Cookie options matching Supabase SSR defaults
        const cookieOptions = {
          path: '/',
          sameSite: 'lax' as const,
          httpOnly: true,
          secure: !isLocalEnv,
          maxAge: 60 * 60 * 24 * 365, // 1 year
        };

        // Supabase chunks cookies at 3180 chars to stay under 4KB limit
        const chunkSize = 3180;

        if (sessionData.length <= chunkSize) {
          // Single cookie
          response.cookies.set(`sb-${projectRef}-auth-token`, sessionData, cookieOptions);
          console.log('[OAuth Callback] Set single auth cookie');
        } else {
          // Chunked cookies
          const chunks = sessionData.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [];
          chunks.forEach((chunk, index) => {
            const name = index === 0
              ? `sb-${projectRef}-auth-token`
              : `sb-${projectRef}-auth-token.${index}`;
            response.cookies.set(name, chunk, cookieOptions);
            console.log('[OAuth Callback] Set cookie chunk:', name);
          });
        }
      }

      return response;
    }

    console.error('[OAuth Callback] Error:', error);
  }

  return NextResponse.redirect(`${request.nextUrl.origin}/login?error=callback_failed`);
}
