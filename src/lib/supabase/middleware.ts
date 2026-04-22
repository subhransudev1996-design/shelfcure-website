import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: must not be removed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /panel/* routes (except login and register)
  const isPanel = request.nextUrl.pathname.startsWith('/panel');
  const isAuthPage =
    request.nextUrl.pathname === '/panel/login' ||
    request.nextUrl.pathname === '/panel/register';

  if (isPanel && !isAuthPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/panel/login';
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/panel';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
