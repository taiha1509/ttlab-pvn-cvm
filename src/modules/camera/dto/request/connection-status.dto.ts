import * as Joi from 'joi';
import { TEXTAREA_MAX_LENGTH } from 'src/common/constants';
import { ConnectionStatus } from 'src/modules/device-controller/deviceController.constant';
export const UpdateConnectionStatusSchema = Joi.object().keys({
    connectionStatus: Joi.string()
        .valid(...Object.values(ConnectionStatus))
        .required(),
});

export interface ISocketRefreshConnectionStatusBody {
    clientSocketRoom: string;
}

export const socketRefreshConnetionStatusSchema = Joi.object().keys({
    clientSocketRoom: Joi.string().max(TEXTAREA_MAX_LENGTH).required(),
});
