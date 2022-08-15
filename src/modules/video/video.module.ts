import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { CameraModule } from '../camera/camera.module';
import { Video, VideoSchema } from './schema/video.schema';
import { VideoService } from './service/video.service';
import { VideoController } from './video.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Video.name, schema: VideoSchema }]),
        CameraModule,
    ],
    controllers: [VideoController],
    providers: [VideoService, JwtGuard],
})
export class VideoModule {
    //
}
