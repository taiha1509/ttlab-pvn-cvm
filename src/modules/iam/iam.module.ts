import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Camera, CameraSchema } from '../camera/schema/camera.schema';
import {
    CameraGroup,
    CameraGroupSchema,
} from '../camera-group/schema/cameraGroup.schema';
import { UserCVMController } from './user.controller';
import { UserCVMService } from './services/userCVM.service';
import { HttpModule } from '@nestjs/axios';
import { HttpConfigService } from 'src/common/services/httpConfig.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Camera.name, schema: CameraSchema },
            { name: CameraGroup.name, schema: CameraGroupSchema },
        ]),
        HttpModule.registerAsync({
            useClass: HttpConfigService,
        }),
    ],
    controllers: [UserCVMController],
    providers: [UserCVMService],
    exports: [],
})
export class IAMModule {}
