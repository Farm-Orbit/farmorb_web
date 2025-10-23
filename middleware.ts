import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes
const protectedRoutes = ['/'];
const authRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password'];

// Define public routes that don't require authentication
const publicRoutes = ['/about', '/contact', '/pricing'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get token from cookies
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    // Check if user is authenticated
    const isAuthenticated = !!(accessToken && refreshToken);

    // Check if current path is protected
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname.startsWith(route)
    );

    // Check if current path is an auth route
    const isAuthRoute = authRoutes.some(route =>
        pathname.startsWith(route)
    );

    // Check if current path is public
    const isPublicRoute = publicRoutes.includes(pathname) ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.');

    // Redirect logic
    if (isProtectedRoute && !isAuthenticated) {
        // Redirect to signin if trying to access protected route without auth
        const signInUrl = new URL('/signin', request.url);
        signInUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(signInUrl);
    }

    if (isAuthRoute && isAuthenticated) {
        // Redirect to admin dashboard if already authenticated and trying to access auth pages
        const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/admin';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Allow the request to continue
    return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    ],
};
