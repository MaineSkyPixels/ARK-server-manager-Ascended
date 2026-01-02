import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './agents/agents.module';
import { HostsModule } from './hosts/hosts.module';
import { InstancesModule } from './instances/instances.module';
import { JobsModule } from './jobs/jobs.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
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

