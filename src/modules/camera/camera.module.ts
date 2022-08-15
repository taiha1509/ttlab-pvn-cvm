import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CameraAppController } from './controllers/camera.app.controller';
import { CameraCVMController } from './controllers/camera.cvm.controller';
import { CameraDeviceController } from './controllers/camera.device.controller';
import { Camera, CameraSchema } from './schema/camera.schema';
import { CameraMongoService } from './service/cameraMongo.service';
import { CameraKinesisService } from './service/cameraKinesis.service';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { OnvifGateway } from '../device-controller/sockets/onvif.gateway';
import { SocketGateway } from '../device-controller/sockets/gateway';
import { UserGroupService } from '../iam/services/user-groups.service';
import { IAMUserService } from '../iam/services/users.service';
import { CameraMongoCVMService } from './service/cameraMongo.cvm.service';
import { CameraGroupCVMService } from '../camera-group/service/cameraGroup.cvm.service';
import { CameraGroupService } from '../camera-group/service/cameraGroup.service';
import { LayoutMapService } from 'src/modules/layout-map/service/layoutMap.service';
import {
    CameraGroup,
    CameraGroupSchema,
} from '../camera-group/schema/cameraGroup.schema';
import { HttpModule } from '@nestjs/axios';
import { HttpConfigService } from 'src/common/services/httpConfig.service';
import { ScheduleService } from 'src/modules/schedule/service/schedule.service';
import {
    ScheduleRepetition,
    ScheduleRepetitionSchema,
} from '../schedule/schema/scheduleRepetition.schema';
import { Schedule, ScheduleSchema } from '../schedule/schema/schedule.schema';
import {
    LayoutMap,
    LayoutMapSchema,
} from '../layout-map/schema/layoutMap.schema';
import { ConnectionStatusGateway } from '../device-controller/sockets/connection-status.gateway';
import { SchedulesGateway } from '../device-controller/sockets/schedules.gateway';
import { UpdateConnectionStatusCronJob } from './cron-job/update-connection-status.job';
import { SetTreeUserGroupIdsGuard } from 'src/common/guards/camera.guard';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Camera.name, schema: CameraSchema },
            { name: CameraGroup.name, schema: CameraGroupSchema },
            { name: ScheduleRepetition.name, schema: ScheduleRepetitionSchema },
            { name: Schedule.name, schema: ScheduleSchema },
            { name: LayoutMap.name, schema: LayoutMapSchema },
        ]),
        HttpModule.registerAsync({
            useClass: HttpConfigService,
        }),
    ],
    controllers: [
        CameraAppController,
        CameraCVMController,
        CameraDeviceController,
    ],
    providers: [
        CameraMongoService,
        CameraKinesisService,
        JwtGuard,
        SocketGateway,
        ConnectionStatusGateway,
        OnvifGateway,
        ScheduleService,
        IAMUserService,
        UserGroupService,
        CameraMongoCVMService,
        CameraGroupCVMService,
        CameraGroupService,
        LayoutMapService,
        UpdateConnectionStatusCronJob,
        SetTreeUserGroupIdsGuard,
        SchedulesGateway,
    ],
    exports: [CameraMongoService],
})
export class CameraModule {}
