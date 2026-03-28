import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { TenantsService } from '../../modules/tenants/tenants.service';
import { TENANT_HEADER } from '../constants';
import type { AuthenticatedUser } from '../../modules/auth/interfaces/jwt-payload.interface';

@Injectable()
export class TenantGuard implements CanActivate {
    constructor(private readonly tenantsService: TenantsService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request>();

        const authenticatedUser = req.user as AuthenticatedUser | undefined;
        const tenantId = authenticatedUser?.tenantId ?? req.tenantId;

        if (!tenantId) {
            throw new ForbiddenException('Tenant context missing');
        }

        await this.tenantsService.validateTenant(tenantId);

        req.tenantId = tenantId;
        req.headers[TENANT_HEADER] = tenantId;

        return true;
    }
}
