import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { SocketEvents } from '../deviceController.constant';
import { SocketGateway } from './gateway';
import { Socket } from 'socket.io';

@WebSocketGateway({
    allowEIO3: true,
    cors: {
        origin: true,
        credentials: true,
    },
})
export class DeviceGateway {
    constructor(
        private readonly configService: ConfigService,
        private readonly socketGateway: SocketGateway,
    ) {
        // eslint-disable-next-line prettier/prettier
    }
    private readonly logger = createWinstonLogger(
        `socket-device`,
        this.configService,
    );

    @SubscribeMessage(SocketEvents.DEVICE_JOIN_ROOM)
    receiveDeviceJoinRoom(client: Socket, payload: { uid: string }) {
        this.logger.info('receive event DEVICE_JOIN_ROOM: ', payload);
        if (payload.uid) client.join(payload.uid);
        return;
    }
}
