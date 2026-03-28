import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { Tenant } from './entities/tenant.entity';
import { REDIS_CLIENT } from '../../infra/redis/redis.module';

@Injectable()
export class TenantsService {
    private readonly CACHE_TTL = 60;
    private readonly CACHE_PREFIX = 'tenant:';

    constructor(
        @InjectRepository(Tenant)
        private readonly tenantRepository: Repository<Tenant>,
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,
    ) { }

    async validateTenant(id: string): Promise<Tenant> {
        const cacheKey = `${this.CACHE_PREFIX}${id}`;
        const cached = await this.redis.get(cacheKey);

        if (cached) {
            const tenant = JSON.parse(cached) as Tenant;
            if (!tenant.isActive) {
                throw new ForbiddenException(`Tenant ${id} is inactive`);
            }
            return tenant;
        }

        const tenant = await this.tenantRepository.findOne({ where: { id } });

        if (!tenant) {
            throw new ForbiddenException(`Tenant ${id} not found`);
        }

        if (!tenant.isActive) {
            throw new ForbiddenException(`Tenant ${id} is inactive`);
        }

        await this.redis.set(cacheKey, JSON.stringify(tenant), 'EX', this.CACHE_TTL);

        return tenant;
    }

    async invalidateCache(tenantId: string): Promise<void> {
        await this.redis.del(`${this.CACHE_PREFIX}${tenantId}`);
    }
}
