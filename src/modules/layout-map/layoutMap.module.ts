import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { Camera, CameraSchema } from '../camera/schema/camera.schema';
import {
    CameraGroup,
    CameraGroupSchema,
} from '../camera-group/schema/cameraGroup.schema';
import { LayoutMapController } from './layoutMap.controller';
import { LayoutMap, LayoutMapSchema } from './schema/layoutMap.schema';
import { LayoutMapService } from './service/layoutMap.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: CameraGroup.name, schema: CameraGroupSchema },
            { name: Camera.name, schema: CameraSchema },
            { name: LayoutMap.name, schema: LayoutMapSchema },
        ]),
    ],
    controllers: [LayoutMapController],
    providers: [LayoutMapService, JwtGuard],
    exports: [LayoutMapService],
})
export class LayoutMapModule {
    //
}
