import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader } from './app/lib/jwt';

export function middleware(request: NextRequest) {
    // Skip authentication for login route
    if (request.nextUrl.pathname === '/api/auth/login') {
        return NextResponse.next();
    }

    // Protect API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        try {
            const authHeader = request.headers.get('authorization');
            if (!authHeader) {
                return NextResponse.json(
                    { error: 'Authorization header missing' },
                    { status: 401 }
                );
            }

            const token = extractTokenFromHeader(authHeader);
            const payload = verifyToken(token);

            // Add user info to request headers
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-user-email', payload.email);

            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*'],
}; 