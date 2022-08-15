import { Module } from '@nestjs/common';
import { OnvifGateway } from './sockets/onvif.gateway';
import { SocketGateway } from './sockets/gateway';
import { DeviceGateway } from './sockets/device.gateway';
import { WebAppGateway } from './sockets/webapp.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Camera, CameraSchema } from '../camera/schema/camera.schema';
import { DeviceController } from './deviceController.controller';
import { DeviceControllerService } from './service/deviceController.service';
import { PTZGateway } from './sockets/ptz.gateway';
import { CameraMongoService } from '../camera/service/cameraMongo.service';
import { ScheduleService } from '../schedule/service/schedule.service';
import { Schedule, ScheduleSchema } from '../schedule/schema/schedule.schema';
import {
    ScheduleRepetition,
    ScheduleRepetitionSchema,
} from '../schedule/schema/scheduleRepetition.schema';
import { SchedulesGateway } from './sockets/schedules.gateway';
import { CameraGroupService } from '../camera-group/service/cameraGroup.service';
import {
    CameraGroup,
    CameraGroupSchema,
} from '../camera-group/schema/cameraGroup.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Camera.name, schema: CameraSchema },
            { name: CameraGroup.name, schema: CameraGroupSchema },
            { name: Schedule.name, schema: ScheduleSchema },
            { name: ScheduleRepetition.name, schema: ScheduleRepetitionSchema },
        ]),
    ],
    controllers: [DeviceController],
    providers: [
        DeviceControllerService,
        SocketGateway,
        DeviceGateway,
        OnvifGateway,
        WebAppGateway,
        PTZGateway,
        CameraMongoService,
        ScheduleService,
        SchedulesGateway,
        CameraGroupService,
    ],
    exports: [OnvifGateway, SocketGateway, SchedulesGateway],
})
export class DeviceControllerModule {}
