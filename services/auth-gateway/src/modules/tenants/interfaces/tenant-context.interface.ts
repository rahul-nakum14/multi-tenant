export interface TenantContext {
    tenantId: string;
    requestId: string;
}

declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
            requestId?: string;
        }
    }
}
