import { MiddlewareConsumer, Module, NestModule, Scope } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CameraModule } from './modules/camera/camera.module';
import { DeviceControllerModule } from './modules/device-controller/deviceController.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { MongoModule } from './common/services/mongo.service';
import { I18nModule } from './common/services/i18n.service';
import { WinstonModule } from './common/services/winston.service';
import envSchema from './common/config/validation-schema';
import { AppController } from './app.controller';
import { HeaderMiddleware } from './common/middleware/header.middleware';
import { CameraGroupModule } from './modules/camera-group/cameraGroup.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/transform.interceptor';
import { HttpExceptionFilter } from './common/exceptions.filter';
import { CommonModule } from './modules/common/common.module';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { VideoModule } from './modules/video/video.module';
import { LiewViewModule } from './modules/live-view/liveView.module';
import { FileModule } from './modules/file/file.module';
import { LayoutMapModule } from './modules/layout-map/layoutMap.module';
import { IAMModule } from './modules/iam/iam.module';
import { HttpModule } from '@nestjs/axios';
import { HttpConfigService } from './common/services/httpConfig.service';
import { Auth0Module } from './common/services/auth0.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
            isGlobal: true,
            validationSchema: envSchema,
        }),
        HttpModule.registerAsync({
            useClass: HttpConfigService,
        }),
        WinstonModule,
        I18nModule,
        MongoModule,
        CameraModule,
        DeviceControllerModule,
        ScheduleModule,
        DeviceControllerModule,
        CameraGroupModule,
        CommonModule,
        NestScheduleModule.forRoot(),
        VideoModule,
        LiewViewModule,
        FileModule,
        LayoutMapModule,
        IAMModule,
        Auth0Module,
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_FILTER,
            scope: Scope.REQUEST,
            useClass: HttpExceptionFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: TransformInterceptor,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(HeaderMiddleware).forRoutes('*');
    }
}
