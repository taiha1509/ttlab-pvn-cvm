import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
    CameraGroup,
    CameraGroupSchema,
} from '../camera-group/schema/cameraGroup.schema';
import { CameraGroupService } from '../camera-group/service/cameraGroup.service';
import { Camera, CameraSchema } from '../camera/schema/camera.schema';
import { LiveViewControler } from './liveView.controller';
import { LiveViewCameraService } from './services/liveviewMongo.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Camera.name, schema: CameraSchema },
            { name: CameraGroup.name, schema: CameraGroupSchema },
        ]),
    ],
    controllers: [LiveViewControler],
    providers: [LiveViewCameraService, CameraGroupService],
})
export class LiewViewModule {}
