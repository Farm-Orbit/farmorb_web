import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const authRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password'];
const publicRoutes = ['/about', '/contact', '/pricing'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isPublicRoute =
        publicRoutes.includes(pathname) ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.');

    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // Skip session work for static public assets
    if (isPublicRoute && !isAuthRoute && pathname !== '/') {
        return NextResponse.next();
    }

    const { user, supabaseResponse } = await updateSession(request);
    const isAuthenticated = !!user;

    if (!isAuthRoute && !isPublicRoute && !isAuthenticated) {
        const signInUrl = new URL('/signin', request.url);
        signInUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(signInUrl);
    }

    if (isAuthRoute && isAuthenticated) {
        const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
