import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { CacheModule } from './modules/cache/cache.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { EnvironmentsModule } from './modules/environments/environments.module';
import { FlagsModule } from './modules/flags/flags.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { RuntimeModule } from './modules/runtime/runtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    CacheModule,
    AuthModule,
    ProjectsModule,
    EnvironmentsModule,
    FlagsModule,
    SegmentsModule,
    RuntimeModule,
  ],
})
export class AppModule {}
