import {
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    Param,
    ParseIntPipe,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { MODULE_NAME } from '../camera.constant';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { JoiValidationPipe } from 'src/common/pipes/joi.validation.pipe';
import { SuccessResponse } from 'src/common/helpers/response';
import {
    CVMCameraListQueryDto,
    CVMCameraListQuerySchema,
} from '../dto/request/list-camera.dto';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';
import {
    CVMUpdateCameraSchemaDto,
    CVMUpdateCameraSchema,
} from '../dto/request/update-camera.dto';
import { CameraMongoCVMService } from '../service/cameraMongo.cvm.service';
import { ROUTER_PREFIX_CVM } from 'src/modules/common/common.constant';
import { Auth0Guard } from 'src/common/guards/auth0.guard';
import { TrimBodyData } from 'src/common/pipes/trim.body.data.pipe';

@Controller(`/${ROUTER_PREFIX_CVM}/camera`)
@UseGuards(Auth0Guard)
export class CameraCVMController {
    constructor(
        private readonly cameraCVMService: CameraMongoCVMService,
        private readonly configService: ConfigService,
        private readonly i18n: I18nRequestScopeService,
    ) {}

    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    @Get()
    async getCameraListByIds(
        @Query(
            new JoiValidationPipe(CVMCameraListQuerySchema),
            new RemoveEmptyQueryPipe(),
        )
        query: CVMCameraListQueryDto,
    ) {
        try {
            if (!query.ids)
                return new SuccessResponse({ items: [], totalItems: 0 });
            const cameraInfo = await this.cameraCVMService.getCameraListByIds(
                query?.ids as string[],
            );
            return new SuccessResponse(cameraInfo);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/user/:id')
    async updateCameraInfo(
        @Param('id', ParseIntPipe) userId: number,
        @Body(new JoiValidationPipe(CVMUpdateCameraSchema), new TrimBodyData())
        body: CVMUpdateCameraSchemaDto,
    ) {
        try {
            await this.cameraCVMService.removeAllUsersInCamera(userId);
            const updateCameras = [];
            body.cameraIds.forEach(async (cameraId) => {
                updateCameras.push(
                    this.cameraCVMService.updateCamerasUserIds(
                        cameraId,
                        userId,
                    ),
                );
            });
            if (updateCameras.length > 0) {
                await Promise.all([...updateCameras]);
            }
            return new SuccessResponse({ id: userId });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete('/user/:id')
    async DeleteUserUpdateCameraInfo(
        @Param('id', ParseIntPipe) userId: number,
    ) {
        try {
            await this.cameraCVMService.removeAllUsersInCamera(userId);
            return new SuccessResponse({ id: userId });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete('/user-group/:id')
    async DeleteGroupUserUpdateCameraInfo(
        @Param('id', ParseIntPipe) userGroupId: number,
    ) {
        try {
            await this.cameraCVMService.removeAllGroupUsersInCamera(
                userGroupId,
            );
            return new SuccessResponse({ id: userGroupId });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
