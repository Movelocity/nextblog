import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';

export const extractTokenFromHeader = (authHeader?: string | null): string => {
    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
    }
    return authHeader.substring(7);
};

export const authenticateRequest = (request: NextRequest): { email: string } | null => {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return null;
        }

        const token = extractTokenFromHeader(authHeader);
        const payload = verifyToken(token);
        return payload;
    } catch (error) {
        return null;
    }
};

export const requireAuth = (handler: Function) => {
    return async (request: NextRequest) => {
        const user = authenticateRequest(request);
        
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return handler(request, user);
    };
}; 