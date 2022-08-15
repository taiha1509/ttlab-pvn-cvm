import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { SocketEvents } from '../deviceController.constant';
import { SocketGateway } from './gateway';
import { ISocketOnvifRequestBody } from '../types';
@WebSocketGateway({
    allowEIO3: true,
    cors: {
        origin: true,
        credentials: true,
    },
})
export class OnvifGateway {
    constructor(
        private readonly configService: ConfigService,
        private readonly socketGateway: SocketGateway,
    ) {
        // eslint-disable-next-line prettier/prettier
    }
    private readonly logger = createWinstonLogger(
        `socket-onvif`,
        this.configService,
    );

    requestOnvifProfile(body: ISocketOnvifRequestBody) {
        this.logger.info('send REQUEST_ONVIF_PROFILE with body = ', body);
        this.socketGateway.server.emit(
            SocketEvents.DEVICE_REQUEST_ONVIF_PROFILE,
            body,
        );
    }

    @SubscribeMessage(SocketEvents.DEVICE_RESPONSE_ONVIF_PROFILE)
    receiveOnvifProfile(@MessageBody() data: Record<string, string | number>) {
        this.logger.info('receive onvif profile from nvr: ', data);
        if (data['clientSocketRoom']) {
            this.logger.info(
                'send to client in room: ',
                data['clientSocketRoom'],
            );
            this.socketGateway.server
                .to(data['clientSocketRoom'] as string)
                .emit(SocketEvents.WEB_APP_SEND_ONVIF_PROFILE, data);
        }
        return;
    }
}
