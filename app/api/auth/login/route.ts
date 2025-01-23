import { NextResponse } from 'next/server';
import { ADMIN_CREDENTIALS } from '@/app/common/config';
import { generateToken } from '@/app/lib/jwt';
import { LoginCredentials } from '@/app/services/auth';

export async function POST(request: Request) {
    try {
        const credentials: LoginCredentials = await request.json();
        
        if (
            credentials.email !== ADMIN_CREDENTIALS.email ||
            credentials.password !== ADMIN_CREDENTIALS.password
        ) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate JWT token for successful login
        const token = generateToken({ email: credentials.email });

        return NextResponse.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 