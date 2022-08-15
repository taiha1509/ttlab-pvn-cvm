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
import { SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipes/joi.validation.pipe';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { MODULE_NAME } from '../cameraGroup.constant';
import {
    CameraGroupListQueryCVMDto,
    CVMCameraGroupListQuerySchema,
} from '../dto/request/list-groupCamera.dto';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';
import { CameraGroupCVMService } from '../service/cameraGroup.cvm.service';
import { ROUTER_PREFIX_CVM } from 'src/modules/common/common.constant';
import { Auth0Guard } from 'src/common/guards/auth0.guard';
import { TrimBodyData } from 'src/common/pipes/trim.body.data.pipe';
import {
    CVMUpdateCameraGroupSchema,
    CVMUpdateCameraGroupSchemaDto,
} from '../dto/request/update-cameraGroup.dto';

@Controller(`/${ROUTER_PREFIX_CVM}/camera-group`)
@UseGuards(Auth0Guard)
export class CameraGroupCVMController {
    constructor(
        private readonly cameraGroupCVMService: CameraGroupCVMService,
        private readonly i18n: I18nRequestScopeService,
        private readonly configService: ConfigService,
    ) {}

    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    @Get()
    async getGroupCameraListByIds(
        @Query(
            new JoiValidationPipe(CVMCameraGroupListQuerySchema),
            new RemoveEmptyQueryPipe(),
        )
        query: CameraGroupListQueryCVMDto,
    ) {
        try {
            if (!query.ids)
                return new SuccessResponse({ items: [], totalItems: 0 });
            const cameraGroupInfo =
                await this.cameraGroupCVMService.getGroupCameraListByIds(
                    query?.ids,
                );
            return new SuccessResponse(cameraGroupInfo);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch('/user/:id')
    async updateCameraGroupInfo(
        @Param('id', ParseIntPipe) userId: number,
        @Body(
            new JoiValidationPipe(CVMUpdateCameraGroupSchema),
            new TrimBodyData(),
        )
        body: CVMUpdateCameraGroupSchemaDto,
    ) {
        try {
            await this.cameraGroupCVMService.removeAllUsersInCamera(userId);
            const updateCameraGroups = [];
            body.cameraGroupIds.forEach(async (cameraGroupId) => {
                updateCameraGroups.push(
                    this.cameraGroupCVMService.updateCamerasGroupUserIds(
                        cameraGroupId,
                        userId,
                    ),
                );
            });
            if (updateCameraGroups.length > 0) {
                await Promise.all([...updateCameraGroups]);
            }
            return new SuccessResponse({ id: userId });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Delete('/user/:id')
    async deleteCameraGroupInfo(@Param('id', ParseIntPipe) id: number) {
        try {
            await this.cameraGroupCVMService.removeAllUsersInCamera(id);
            return new SuccessResponse({ id });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
