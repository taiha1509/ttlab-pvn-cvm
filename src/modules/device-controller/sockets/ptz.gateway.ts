import { WebSocketGateway } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { SocketEvents } from '../deviceController.constant';
import { SocketGateway } from './gateway';
import { ControlCameraPTZDto } from '../dto/request/control-camera-ptz.dto';

@WebSocketGateway({
    allowEIO3: true,
    cors: {
        origin: true,
        credentials: true,
    },
})
export class PTZGateway {
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

    controlCameraPTZ(cameraUid: string, data: ControlCameraPTZDto) {
        this.logger.info(
            `Send EVENT=${SocketEvents.DEVICE_PTZ_CONTROL} to ROOM=${cameraUid} with DATA=${data}`,
        );
        this.socketGateway.server
            .to(cameraUid)
            .emit(SocketEvents.DEVICE_PTZ_CONTROL, data);
    }
}
