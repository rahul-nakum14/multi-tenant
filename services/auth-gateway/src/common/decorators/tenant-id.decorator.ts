import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TENANT_HEADER } from '../constants';

export const TenantId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest();
        return request.headers[TENANT_HEADER];
    },
);
