import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { Tenant } from './entities/tenant.entity';
import { REDIS_CLIENT } from '../../infra/redis/redis.module';
import { TENANT_CACHE_TTL_SECONDS, TENANT_CACHE_PREFIX } from '../../common/constants';

@Injectable()
export class TenantsService {
    constructor(
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,
    ) { }

    async validateTenant(id: string): Promise<Tenant> {
        const cacheKey = `${TENANT_CACHE_PREFIX}:${id}`;
        const cached = await this.redis.get(cacheKey);

        if (cached) {
            const tenant = JSON.parse(cached) as Tenant;
            if (!tenant.isActive) {
                throw new ForbiddenException('Tenant access denied');
            }
            return tenant;
        }

        const tenant = await this.tenantRepository.findOne({ where: { id } });

        if (!tenant) {
            throw new ForbiddenException('Invalid or unknown tenant');
        }

        if (!tenant.isActive) {
            throw new ForbiddenException('Tenant access denied');
        }

        await this.redis.set(cacheKey, JSON.stringify(tenant), 'EX', TENANT_CACHE_TTL_SECONDS);

        return tenant;
    }

    async invalidateCache(tenantId: string): Promise<void> {
        await this.redis.del(`${TENANT_CACHE_PREFIX}:${tenantId}`);
    }
}
