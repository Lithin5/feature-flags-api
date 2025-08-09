import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EnvironmentsModule } from './environments/environments.module';
import { PlatformsModule } from './platforms/platforms.module';
import { FeatureFlagScopeModule } from './feature-flag-scope/feature-flag-scope.module';
import { CacheModule } from './cache/cache.module';
import { PrismaService } from './prisma/prisma.service';
import { FeatureFlagChangeRequestModule } from './feature-flag-change-request/feature-flag-change-request.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DashboardModule } from './dashboard/dashboard.module';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    CacheModule,
    AuthModule, 
    PrismaModule, 
    UsersModule, 
    EnvironmentsModule, 
    PlatformsModule, 
    FeatureFlagScopeModule, 
    FeatureFlagsModule, 
    FeatureFlagChangeRequestModule,
    AnalyticsModule,
    DashboardModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
