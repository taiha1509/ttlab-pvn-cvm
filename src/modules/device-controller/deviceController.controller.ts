import {
    Body,
    Controller,
    Get,
    InternalServerErrorException,
    Param,
    Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipes/joi.validation.pipe';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { MODULE_NAME } from './deviceController.constant';
import { ICameraParam } from './deviceController.types';
import { CameraQuerySchema } from './dto/request/list-camera.dto';
import { DeviceControllerService } from './service/deviceController.service';
import { ROUTER_PREFIX_APP } from 'src/modules/common/common.constant';
import { HttpStatus } from 'src/common/constants';
import { OnvifGateway } from './sockets/onvif.gateway';
import ConfigKey from 'src/common/config/config-key';
import {
    ControlCameraPTZDto,
    ControlCameraPTZSchema,
} from './dto/request/control-camera-ptz.dto';
import Joi from 'src/plugins/joi';
import { PTZGateway } from './sockets/ptz.gateway';

@Controller(`/${ROUTER_PREFIX_APP}/device-controller`)
export class DeviceController {
    constructor(
        private readonly deviceControllerService: DeviceControllerService,
        private readonly configService: ConfigService,
        private readonly i18n: I18nService,
        private readonly onvifGateway: OnvifGateway,
        private readonly ptzGateway: PTZGateway,
    ) {}

    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    @Get('/camera/:uid')
    async getCameraById(
        @Param(new JoiValidationPipe(CameraQuerySchema))
        id: ICameraParam,
    ) {
        try {
            const { uid } = id;
            const cameraInfo =
                await this.deviceControllerService.getCameraDetailByUid(uid);
            if (!cameraInfo) {
                const message = await this.i18n.translate(
                    'deviceController.error.cameraNotExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse({
                _id: cameraInfo._id,
                uid: cameraInfo.uid,
                kinesisChannelARN: cameraInfo.kinesisChannelARN,
                awsKey: {
                    accessKey: process.env[ConfigKey.AWS_ACCESS_KEY_ID],
                    secretAccessKey:
                        process.env[ConfigKey.AWS_SECRET_ACCESS_KEY],
                    region: process.env[ConfigKey.AWS_REGION],
                },
            });
        } catch (error) {
            this.logger.error(
                `Error in ${DeviceController.name} - getCameraById func: `,
                error,
            );
            throw new InternalServerErrorException(error);
        }
    }

    @Post('/camera/:cameraId/ptz')
    async controlCameraPTZ(
        @Param('cameraId', new JoiValidationPipe(Joi.isObjectId()))
        cameraId: string,
        @Body(new JoiValidationPipe(ControlCameraPTZSchema))
        body: ControlCameraPTZDto,
    ) {
        try {
            const camera =
                await this.deviceControllerService.getCameraDetailById(
                    cameraId,
                );
            if (!camera) {
                const message = await this.i18n.translate(
                    'deviceController.error.cameraNotExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            this.ptzGateway.controlCameraPTZ(camera.uid, body);
            return new SuccessResponse();
        } catch (error) {
            this.logger.error(
                `Error in ${DeviceController.name} - controlCameraPTZ func: `,
                error,
            );
            throw new InternalServerErrorException(error);
        }
    }
}
