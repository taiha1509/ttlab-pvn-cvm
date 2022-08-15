import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { ConnectionStatus, SocketEvents } from '../deviceController.constant';
import { SocketGateway } from './gateway';
import { IConnectionStatusResponse } from '../dto/response/connection-status.dto';
import { CameraMongoService } from 'src/modules/camera/service/cameraMongo.service';
@WebSocketGateway({
    allowEIO3: true,
    cors: {
        origin: true,
        credentials: true,
    },
})
export class ConnectionStatusGateway {
    constructor(
        private readonly configService: ConfigService,
        private readonly socketGateway: SocketGateway,
        private readonly cameraService: CameraMongoService,
    ) {
        // eslint-disable-next-line prettier/prettier
    }
    private readonly logger = createWinstonLogger(
        `socket-connection-status`,
        this.configService,
    );

    requestConnectionStatus(uid: string, clientSocketRoom: string) {
        this.logger.info(
            `connection status request with client socket room = ${clientSocketRoom}, uid = ${uid}`,
        );
        this.socketGateway.server
            .to(uid)
            .emit(SocketEvents.DEVICE_REQUEST_CAMERA_CONNECTION_STATUS, {
                clientSocketRoom,
            });
    }

    updateConnectionStatusToWebApp(body: IConnectionStatusResponse) {
        this.logger.info(
            'connection status is received, sending status to web app, body = ',
            body,
        );
        this.socketGateway.server
            .to(body.clientSocketRoom)
            .emit(SocketEvents.WEB_APP_UPDATE_CAMERA_CONNECTION_STATUS, {
                status: ConnectionStatus.ONLINE,
                uid: body.uid,
            });
    }

    @SubscribeMessage(SocketEvents.DEVICE_RESPONSE_CAMERA_CONNECTION_STATUS)
    responseConnectionStatus(@MessageBody() data: IConnectionStatusResponse) {
        this.logger.info('connection status response with body = ', data);
        this.updateConnectionStatusToWebApp(data);
    }
}
