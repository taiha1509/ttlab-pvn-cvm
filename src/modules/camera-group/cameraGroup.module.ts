import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CameraGroupAppController } from './controllers/cameraGroup.app.controller';
import { CameraGroupCVMController } from './controllers/cameraGroup.cvm.controller';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { CameraGroup, CameraGroupSchema } from './schema/cameraGroup.schema';
import { CameraGroupService } from './service/cameraGroup.service';
import { CameraGroupCVMService } from './service/cameraGroup.cvm.service';
import { HttpConfigService } from 'src/common/services/httpConfig.service';
import { HttpModule } from '@nestjs/axios';
import { Camera, CameraSchema } from '../camera/schema/camera.schema';
import { CameraMongoService } from '../camera/service/cameraMongo.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: CameraGroup.name, schema: CameraGroupSchema },
            { name: Camera.name, schema: CameraSchema },
        ]),
        HttpModule.registerAsync({
            useClass: HttpConfigService,
        }),
    ],
    controllers: [CameraGroupAppController, CameraGroupCVMController],
    providers: [
        CameraGroupService,
        JwtGuard,
        CameraGroupCVMService,
        CameraMongoService,
    ],
    exports: [CameraGroupCVMService],
})
export class CameraGroupModule {}
