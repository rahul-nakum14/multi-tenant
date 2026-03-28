export interface JwtPayload {
    sub: string;
    tenant_id: string;
    role: string;
    scope: string;
    iat?: number;
    exp?: number;
}

export interface AuthenticatedUser {
    id: string;
    email: string;
    tenantId: string;
    role: string;
    firstName?: string;
    lastName?: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
}
