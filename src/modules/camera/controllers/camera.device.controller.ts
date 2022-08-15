import {
    Body,
    Controller,
    InternalServerErrorException,
    Param,
    Post,
} from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { uidSchema } from 'src/common/constants';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipes/joi.validation.pipe';
import { TrimBodyData } from 'src/common/pipes/trim.body.data.pipe';
import { ROUTER_PREFIX_DEVICE } from 'src/modules/common/common.constant';
import { HttpStatus } from 'src/common/constants';
import { ICameraUpdateConnectionStatusDto } from 'src/modules/device-controller/dto/request/connection-status.dto';
import { UpdateConnectionStatusSchema } from '../dto/request/connection-status.dto';
import { CameraMongoService } from '../service/cameraMongo.service';

@Controller(`/${ROUTER_PREFIX_DEVICE}/camera`)
export class CameraDeviceController {
    constructor(
        private readonly cameraService: CameraMongoService,
        private readonly i18n: I18nRequestScopeService,
    ) {}

    @Post(':uid/connection-status')
    async updateConnectionStatus(
        @Param('uid', new JoiValidationPipe(uidSchema)) uid,
        @Body(
            new JoiValidationPipe(UpdateConnectionStatusSchema),
            new TrimBodyData(),
        )
        body: ICameraUpdateConnectionStatusDto,
    ) {
        try {
            const camera = await this.cameraService.getCameraByUid(uid);
            if (!camera) {
                const message = await this.i18n.t('camera.get.wrong.uid');
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }
            const updatedCamera =
                await this.cameraService.updateConnectionStatus(camera);
            return new SuccessResponse(updatedCamera);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
