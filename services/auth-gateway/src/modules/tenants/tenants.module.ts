import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantsService } from './tenants.service';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([Tenant])],
    providers: [TenantsService],
    exports: [TenantsService],
})
export class TenantsModule { }
