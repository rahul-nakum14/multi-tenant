import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TENANT_HEADER } from '../constants';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const tenantId = req.headers[TENANT_HEADER] as string | undefined;
        if (tenantId) {
            req.tenantId = tenantId;
        }
        next();
    }
}
