import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { HostsModule } from './hosts/hosts.module';
import { InstancesModule } from './instances/instances.module';
import { JobsModule } from './jobs/jobs.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { WebsocketModule } from './websocket/websocket.module';
import { AppConfigModule } from './config/config.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    HealthModule,
    WebsocketModule,
    AgentsModule,
    HostsModule,
    InstancesModule,
    JobsModule,
  ],
})
export class AppModule {}

