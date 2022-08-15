import {
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { JoiValidationPipe } from 'src/common/pipes/joi.validation.pipe';
import { createWinstonLogger } from 'src/common/services/winston.service';
import Joi from 'src/plugins/joi';
import { ROUTER_PREFIX_APP } from '../common/common.constant';
import { HttpStatus } from 'src/common/constants';
import {
    CreateLayoutMapDto,
    createLayoutMapSchema,
} from './dto/request/create-layout-map.dto';
import {
    UpdateLayoutMapDto,
    updateLayoutMapSchema,
} from './dto/request/update-layout-map.dto';
import { MODULE_NAME } from './layoutMap.constant';
import { LayoutMapService } from './service/layoutMap.service';
import map from 'lodash/map';
import { TrimBodyData } from 'src/common/pipes/trim.body.data.pipe';
import { RoleGuard } from 'src/common/guards/role.guard';
import {
    PermissionActions,
    PermissionResources,
    Permissions,
} from 'src/common/constants';

@Controller(`/${ROUTER_PREFIX_APP}/layout-map`)
@UseGuards(JwtGuard, RoleGuard)
export class LayoutMapController {
    constructor(
        private readonly layoutMapService: LayoutMapService,
        private readonly i18n: I18nRequestScopeService,
        private readonly configService: ConfigService,
    ) {
        //
    }

    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    @Delete(':id')
    @Permissions(`${PermissionResources.E_MAP}_${PermissionActions.DELETE}`)
    async deleteLayoutMap(
        @Req() req,
        @Param('id', new JoiValidationPipe(Joi.isObjectId())) id: string,
    ) {
        try {
            const isLayoutMapExist =
                await this.layoutMapService.checkLayoutMapExistByField(
                    '_id',
                    id,
                );
            if (!isLayoutMapExist) {
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    await this.i18n.translate('layoutMap.error.notExist'),
                );
            }
            await this.layoutMapService.deleteLayoutMap(id, req.loginUser?.id);
            return new SuccessResponse({ _id: id });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':id')
    @Permissions(`${PermissionResources.E_MAP}_${PermissionActions.READ}`)
    async getLayoutMapDetail(
        @Param('id', new JoiValidationPipe(Joi.isObjectId())) id: string,
    ) {
        try {
            const layoutMap = await this.layoutMapService.getLayoutMapDetail(
                '_id',
                id,
            );
            if (!layoutMap) {
                const message = await this.i18n.translate(
                    'layoutMap.error.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse(layoutMap);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get('/camera-group/:cameraGroupId')
    @Permissions(`${PermissionResources.E_MAP}_${PermissionActions.READ}`)
    async getLayoutMapDetailByCameraGroupId(
        @Param('cameraGroupId', new JoiValidationPipe(Joi.isObjectId()))
        cameraGroupId: string,
    ) {
        try {
            const layoutMap = await this.layoutMapService.getLayoutMapDetail(
                'cameraGroup',
                cameraGroupId,
            );
            if (!layoutMap) {
                const message = await this.i18n.translate(
                    'layoutMap.error.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse(layoutMap);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post()
    @Permissions(`${PermissionResources.E_MAP}_${PermissionActions.CREATE}`)
    async createLayoutMap(
        @Req() req,
        @Body(new JoiValidationPipe(createLayoutMapSchema), new TrimBodyData())
        body: CreateLayoutMapDto,
    ) {
        try {
            const { loginUser } = req;
            const isGroupCameraExist =
                await this.layoutMapService.checkCameraGroupExistByField(
                    '_id',
                    body.cameraGroupId,
                );
            if (!isGroupCameraExist) {
                const message = await this.i18n.translate(
                    'groupCamera.get.wrong.id',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'cameraGroupId',
                        errorCode: HttpStatus.ITEM_NOT_FOUND,
                        message,
                    },
                ]);
            }
            const isDuplicatedLayoutMapByCameraGroupId =
                await this.layoutMapService.checkLayoutMapExistByField(
                    'cameraGroup',
                    body.cameraGroupId,
                );
            if (isDuplicatedLayoutMapByCameraGroupId) {
                const message = await this.i18n.translate(
                    'layoutMap.error.exist',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'cameraGroup',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }
            const isDuplicatedLayoutMapByName =
                await this.layoutMapService.checkLayoutMapExistByField(
                    'name',
                    body.name,
                );
            if (isDuplicatedLayoutMapByName) {
                const message = await this.i18n.translate(
                    'layoutMap.error.existName',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }
            const createdLayoutMap =
                await this.layoutMapService.createLayoutMap({
                    cameraGroup: body.cameraGroupId,
                    name: body.name,
                    file: body.file,
                    createdBy: loginUser.id,
                });
            return new SuccessResponse(createdLayoutMap);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id')
    @Permissions(`${PermissionResources.E_MAP}_${PermissionActions.UPDATE}`)
    async updateLayoutMap(
        @Req() req,
        @Param('id', new JoiValidationPipe(Joi.isObjectId())) id: string,
        @Body(new JoiValidationPipe(updateLayoutMapSchema), new TrimBodyData())
        body: UpdateLayoutMapDto,
    ) {
        try {
            const { loginUser } = req;
            const layoutMap = await this.layoutMapService.getLayoutMapDetail(
                '_id',
                id,
            );
            if (!layoutMap) {
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    await this.i18n.translate('layoutMap.error.notExist'),
                );
            }
            if (body.name) {
                const isDuplicatedLayoutMapByName =
                    await this.layoutMapService.checkLayoutMapExistByField(
                        'name',
                        body.name,
                        id,
                    );
                if (isDuplicatedLayoutMapByName) {
                    const message = await this.i18n.translate(
                        'layoutMap.error.existName',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'name',
                            errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                            message,
                        },
                    ]);
                }
            }
            if (body.cameraCoordinates.length) {
                const isValidCameras =
                    await this.layoutMapService.checkValidCameras(
                        map(body.cameraCoordinates, 'cameraId'),
                        layoutMap.cameraGroupId.toString(),
                    );
                if (!isValidCameras) {
                    const message = await this.i18n.translate(
                        'layoutMap.error.invalidCameras',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'cameraId',
                            errorCode: HttpStatus.BAD_REQUEST,
                            message,
                        },
                    ]);
                }
                body.cameraCoordinates = body.cameraCoordinates.map((item) => ({
                    camera: item.cameraId,
                    x: item.x,
                    y: item.y,
                }));
            }
            body.updatedBy = loginUser.id;
            const result = await this.layoutMapService.updateLayoutMap(
                id,
                body,
            );
            return new SuccessResponse(result);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
