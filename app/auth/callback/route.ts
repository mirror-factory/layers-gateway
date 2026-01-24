import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Force a redirect that will cause the middleware to re-run
      const redirectUrl = new URL(next, origin);
      const response = NextResponse.redirect(redirectUrl);

      // Ensure cookies are set on the response
      return response;
    }

    console.error('OAuth callback error:', error);
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
