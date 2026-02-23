import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    let user = null;
    try {
        const { data } = await supabase.auth.getUser();
        user = data.user;
    } catch (err: unknown) {
        const authErr = err as { code?: string };
        if (authErr?.code === 'refresh_token_not_found') {
            // Stale refresh token — clear broken auth cookies
            request.cookies.getAll().forEach((cookie) => {
                if (cookie.name.startsWith('sb-')) {
                    supabaseResponse.cookies.delete(cookie.name);
                }
            });
        }
    }

    const protectedRoutes = ['/dashboard', '/settings'];
    const isProtected = protectedRoutes.some((route) =>
        request.nextUrl.pathname.startsWith(route)
    );

    if (!user && isProtected) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        const redirectResponse = NextResponse.redirect(url);
        // Also clear stale cookies on redirect
        request.cookies.getAll().forEach((cookie) => {
            if (cookie.name.startsWith('sb-')) {
                redirectResponse.cookies.delete(cookie.name);
            }
        });
        return redirectResponse;
    }

    return supabaseResponse;
}
