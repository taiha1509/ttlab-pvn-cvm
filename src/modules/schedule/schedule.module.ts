import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Schedule, ScheduleSchema } from './schema/schedule.schema';
import {
    ScheduleRepetition,
    ScheduleRepetitionSchema,
} from './schema/scheduleRepetition.schema';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './service/schedule.service';
import { ScheduleJob } from './cron-job/schedule.job';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { Camera, CameraSchema } from '../camera/schema/camera.schema';
import { CameraMongoService } from '../camera/service/cameraMongo.service';
import { SchedulesGateway } from '../device-controller/sockets/schedules.gateway';
import { SocketGateway } from '../device-controller/sockets/gateway';
import { CameraGroupService } from '../camera-group/service/cameraGroup.service';
import { UserGroupService } from '../iam/services/user-groups.service';
import { SetTreeUserGroupIdsGuard } from 'src/common/guards/camera.guard';
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
    controllers: [ScheduleController],
    providers: [
        ScheduleService,
        JwtGuard,
        ScheduleJob,
        CameraMongoService,
        SchedulesGateway,
        SocketGateway,
        CameraGroupService,
        UserGroupService,
        SetTreeUserGroupIdsGuard,
    ],
})
// eslint-disable-next-line prettier/prettier
export class ScheduleModule { }
