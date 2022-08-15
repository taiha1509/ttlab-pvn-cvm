import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Camera, CameraSchema } from '../camera/schema/camera.schema';
import {
    CameraGroup,
    CameraGroupSchema,
} from '../camera-group/schema/cameraGroup.schema';
import { CommonController } from './common.controller';
import { CommonDropdownService } from './service/common-dropdown.service';
import { CameraGroupService } from '../camera-group/service/cameraGroup.service';
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: CameraGroup.name, schema: CameraGroupSchema },
        ]),
        MongooseModule.forFeature([
            { name: Camera.name, schema: CameraSchema },
        ]),
    ],
    controllers: [CommonController],
    providers: [CommonDropdownService, CameraGroupService],
})
export class CommonModule {
    //
}
