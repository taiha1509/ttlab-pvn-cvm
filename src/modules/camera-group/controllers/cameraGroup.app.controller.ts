import {
    Body,
    Controller,
    Delete,
    Get,
    InternalServerErrorException,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { JoiValidationPipe } from 'src/common/pipes/joi.validation.pipe';
import { createWinstonLogger } from 'src/common/services/winston.service';
import {
    CreateCameraGroupDto,
    CreateCameraGroupSchema,
} from '../dto/request/create-cameraGroup.dto';
import {
    UpdateCameraGroupDto,
    UpdateCameraGroupSchema,
} from '../dto/request/update-cameraGroup.dto';
import {
    MAX_LEVEL,
    MAX_SUBGROUPS_QUANTITY,
    MODULE_NAME,
} from '../cameraGroup.constant';
import { CameraGroupService } from '../service/cameraGroup.service';
import { ObjectId } from 'mongodb';
import {
    CameraGroupListQueryDto,
    CameraGroupListQuerySchema,
} from '../dto/request/list-groupCamera.dto';
import { ROUTER_PREFIX_APP } from 'src/modules/common/common.constant';
import { HttpStatus } from 'src/common/constants';
import Joi from 'src/plugins/joi';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';
import { TrimBodyData } from 'src/common/pipes/trim.body.data.pipe';
import {
    PermissionActions,
    PermissionResources,
    Permissions,
} from 'src/common/constants';
import { RoleGuard } from 'src/common/guards/role.guard';
import { CameraMongoService } from 'src/modules/camera/service/cameraMongo.service';

@Controller(`/${ROUTER_PREFIX_APP}/camera-group`)
@UseGuards(JwtGuard, RoleGuard)
export class CameraGroupAppController {
    constructor(
        private readonly cameraGroupService: CameraGroupService,
        private readonly i18n: I18nRequestScopeService,
        private readonly configService: ConfigService,
        private readonly cameraService: CameraMongoService,
    ) {}

    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    @Post()
    @Permissions(
        `${PermissionResources.CAMERA_GROUP}_${PermissionActions.CREATE}`,
    )
    async createCameraGroup(
        @Req() req,
        @Body(
            new JoiValidationPipe(CreateCameraGroupSchema),
            new TrimBodyData(),
        )
        cameraGroup: CreateCameraGroupDto,
    ) {
        try {
            const groupCameraInfo = { ...cameraGroup };
            // check if parent group existed
            if (cameraGroup.parentId) {
                const parentGroupInfo =
                    await this.cameraGroupService.getGroupCameraById(
                        new ObjectId(cameraGroup.parentId),
                    );
                if (!parentGroupInfo) {
                    const message = await this.i18n.translate(
                        'groupCamera.create.parentId.invalid',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'cameraGroupId',
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                            message,
                        },
                    ]);
                }
                // check max level of subgroups
                if (parentGroupInfo.level === MAX_LEVEL) {
                    const message = await this.i18n.translate(
                        'groupCamera.create.max.level',
                        { args: { max: MAX_LEVEL } },
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'parentId',
                            errorCode: HttpStatus.GROUP_MAX_LEVEL,
                            message,
                        },
                    ]);
                }
                groupCameraInfo.level = parentGroupInfo.level + 1;
                const subGroup =
                    await this.cameraGroupService.getGroupCameraListByParentId(
                        parentGroupInfo._id,
                    );
                // check length of subgroups
                if (subGroup.length > MAX_SUBGROUPS_QUANTITY) {
                    const message = await this.i18n.translate(
                        'groupCamera.create.max.subGroup',
                        { args: { max: MAX_SUBGROUPS_QUANTITY } },
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'parentId',
                            errorCode: HttpStatus.GROUP_MAX_QUANTITY,
                            message,
                        },
                    ]);
                }
            }
            const isNameExisted =
                await this.cameraGroupService.checkNameIsExisted(
                    cameraGroup.name,
                    cameraGroup.parentId
                        ? new ObjectId(cameraGroup.parentId)
                        : null,
                );
            if (isNameExisted) {
                const message = await this.i18n.translate(
                    'groupCamera.create.name.duplicate',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }
            const createdGroupCamera =
                await this.cameraGroupService.createCameraGroup({
                    ...groupCameraInfo,
                    parentId: cameraGroup.parentId
                        ? new ObjectId(cameraGroup.parentId)
                        : null,
                    createdBy: req.loginUser.id,
                });
            return new SuccessResponse(createdGroupCamera);
        } catch (error) {
            return new InternalServerErrorException(error);
        }
    }

    @Patch(':id')
    @Permissions(
        `${PermissionResources.CAMERA_GROUP}_${PermissionActions.UPDATE}`,
    )
    async updateGroupCamera(
        @Req() req,
        @Param('id', new JoiValidationPipe(Joi.isObjectId())) id: string,
        @Body(
            new JoiValidationPipe(UpdateCameraGroupSchema),
            new TrimBodyData(),
        )
        groupCamera: UpdateCameraGroupDto,
    ) {
        try {
            const groupCameraInfo = { ...groupCamera };
            const currentGroupInfo =
                await this.cameraGroupService.getGroupCameraById(
                    new ObjectId(id),
                );
            // check if current group existed
            if (!currentGroupInfo) {
                const message = await this.i18n.translate(
                    'groupCamera.get.wrong.id',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            // check name is existed
            const isNameExisted =
                await this.cameraGroupService.checkNameIsExisted(
                    groupCamera.name,
                    currentGroupInfo.parentId,
                    new ObjectId(id),
                );
            if (isNameExisted) {
                const message = await this.i18n.translate(
                    'groupCamera.create.name.duplicate',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'name',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }
            // TODO check if this user is admin so we don't need to check admin is assigned for this group

            const updatedGroupCamera =
                await this.cameraGroupService.updateCameraGroupById(id, {
                    ...groupCameraInfo,
                    updatedBy: req.loginUser.id,
                });
            return new SuccessResponse(updatedGroupCamera);
        } catch (error) {
            return new InternalServerErrorException(error);
        }
    }

    @Delete(':id')
    @Permissions(
        `${PermissionResources.CAMERA_GROUP}_${PermissionActions.DELETE}`,
    )
    async deleteCamera(
        @Req() req,
        @Param('id', new JoiValidationPipe(Joi.isObjectId())) id: string,
    ) {
        try {
            const groupCameraInfo =
                await this.cameraGroupService.getGroupCameraById(
                    new ObjectId(id),
                );
            if (!groupCameraInfo) {
                const message = await this.i18n.translate(
                    'groupCamera.get.wrong.id',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const subGroupList =
                await this.cameraGroupService.getGroupCameraListByParentId(
                    groupCameraInfo._id,
                );
            if (subGroupList.length > 0) {
                const message = await this.i18n.translate(
                    'groupCamera.delete.containsChildren',
                );
                return new ErrorResponse(
                    HttpStatus.GROUP_HAS_CHILDREN,
                    message,
                    [],
                );
            }
            // TODO check if this user is admin so we don't need to check admin is assigned for this group
            await this.cameraService.updateDeletedCameraGroup(id);
            // delete
            const deletedCamera =
                await this.cameraGroupService.deleteGroupCameraById(id, {
                    ...groupCameraInfo,
                    deletedAt: new Date(),
                    deletedBy: req.loginUser.id,
                });
            if (deletedCamera) return new SuccessResponse(deletedCamera);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get()
    @Permissions(
        `${PermissionResources.CAMERA_GROUP}_${PermissionActions.READ}`,
    )
    async getGroupCameraList(
        @Query(
            new JoiValidationPipe(CameraGroupListQuerySchema),
            new RemoveEmptyQueryPipe(),
        )
        query: CameraGroupListQueryDto,
    ) {
        try {
            const groupCameraList =
                await this.cameraGroupService.getGroupCameraList(query);
            return new SuccessResponse(groupCameraList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':id')
    @Permissions(
        `${PermissionResources.CAMERA_GROUP}_${PermissionActions.READ}`,
    )
    async getCameraById(
        @Param('id', new JoiValidationPipe(Joi.isObjectId())) id: string,
    ) {
        try {
            const cameraGroupInfo =
                await this.cameraGroupService.getGroupCameraById(
                    new ObjectId(id),
                );
            if (!cameraGroupInfo) {
                const message = await this.i18n.translate(
                    'groupCamera.get.wrong.id',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse(cameraGroupInfo);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
