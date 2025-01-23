import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../common/config';

export interface JWTPayload {
    email: string;
    password?: string;
    iat?: number;
    exp?: number;
}

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): JWTPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) { // eslint-disable-line no-unused-vars
        throw new Error('Invalid token');
    }
};

export const extractTokenFromHeader = (authHeader?: string): string => {
    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Invalid authorization header');
    }
    return authHeader.substring(7);
}; 