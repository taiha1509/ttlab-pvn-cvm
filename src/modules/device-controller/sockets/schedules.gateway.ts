import { WebSocketGateway } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { SocketEvents } from '../deviceController.constant';
import { SocketGateway } from './gateway';
import { SchedulesData } from '../dto/request/control-camera-ptz.dto';

@WebSocketGateway({
    allowEIO3: true,
    cors: {
        origin: true,
        credentials: true,
    },
})
export class SchedulesGateway {
    constructor(
        private readonly configService: ConfigService,
        private readonly socketGateway: SocketGateway,
    ) {
        // eslint-disable-next-line prettier/prettier
    }
    private readonly logger = createWinstonLogger(
        `socket-ptz`,
        this.configService,
    );

    sendSchedules(cameraUid: string, data: SchedulesData) {
        this.logger.info(
            `Send EVENT=${SocketEvents.DEVICE_SEND_SCHEDULES_CAMERA} to ROOM=${cameraUid} with DATA=${data}`,
        );
        this.socketGateway.server
            .to(cameraUid)
            .emit(SocketEvents.DEVICE_SEND_SCHEDULES_CAMERA, data);
    }
}
