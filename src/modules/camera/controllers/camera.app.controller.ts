import {
    Controller,
    Get,
    Post,
    Body,
    InternalServerErrorException,
    Query,
    UseGuards,
    Patch,
    Param,
    Delete,
    Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ROUTER_PREFIX_APP } from 'src/modules/common/common.constant';
import { HttpStatus } from 'src/common/constants';
import { I18nRequestScopeService } from 'nestjs-i18n';
import {
    MAX_CAMERAS_IN_GROUP,
    MODULE_NAME,
    SERIAL_NUMBER,
    UID,
    USERNAME,
} from '../camera.constant';
import {
    CreateCameraDto,
    CreateCameraSchema,
} from '../dto/request/create-camera.dto';
import { CameraMongoService } from '../service/cameraMongo.service';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { JoiValidationPipe } from 'src/common/pipes/joi.validation.pipe';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import * as bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import {
    CameraListQueryDto,
    CameraListQuerySchema,
} from '../dto/request/list-camera.dto';
import { CameraKinesisService } from '../service/cameraKinesis.service';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import {
    UpdateCameraDto,
    UpdateCameraRecordingConfigurationDto,
    UpdateCameraRecordingConfigurationSchema,
    UpdateCameraSchema,
} from '../dto/request/update-camera.dto';
import Joi from 'src/plugins/joi';
import {
    OnvifRequestDto,
    OnvifRequestSchema,
} from '../dto/request/request-onvif-profile.dto';
import { OnvifGateway } from '../../device-controller/sockets/onvif.gateway';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';
import { IAMUserService } from 'src/modules/iam/services/users.service';
import { UserGroupService } from 'src/modules/iam/services/user-groups.service';
import { IGroupUserCVMResponse, IUserCVMResponse } from 'src/modules/iam/types';
import { CameraDetailResponseDto } from '../dto/response/detail.dto';
import { CameraGroupService } from 'src/modules/camera-group/service/cameraGroup.service';
import { TrimBodyData } from 'src/common/pipes/trim.body.data.pipe';
import { RoleGuard } from 'src/common/guards/role.guard';
import { LayoutMapService } from 'src/modules/layout-map/service/layoutMap.service';
import {
    PermissionActions,
    PermissionResources,
    Permissions,
    UserTypes,
} from 'src/common/constants';
import { ScheduleService } from 'src/modules/schedule/service/schedule.service';
import {
    ISocketRefreshConnectionStatusBody,
    socketRefreshConnetionStatusSchema,
} from '../dto/request/connection-status.dto';
import { ConnectionStatusGateway } from 'src/modules/device-controller/sockets/connection-status.gateway';
import { SetTreeUserGroupIdsGuard } from 'src/common/guards/camera.guard';
@Controller(`/${ROUTER_PREFIX_APP}/camera`)
@UseGuards(JwtGuard, RoleGuard)
export class CameraAppController {
    constructor(
        private readonly cameraService: CameraMongoService,
        private readonly kinesisService: CameraKinesisService,
        private readonly cameraGroupService: CameraGroupService,
        private readonly configService: ConfigService,
        private readonly i18n: I18nRequestScopeService,
        private readonly iamUserService: IAMUserService,
        private readonly onvifGateway: OnvifGateway,
        private readonly connectionStatusGateway: ConnectionStatusGateway,
        private readonly layoutService: LayoutMapService,
        private readonly iamUserGroupService: UserGroupService,
        private readonly schedulesService: ScheduleService,
    ) {}

    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    @Delete(':id')
    @UseGuards(SetTreeUserGroupIdsGuard)
    @Permissions(`${PermissionResources.CAMERA}_${PermissionActions.DELETE}`)
    async deleteCamera(
        @Req() req,
        @Param('id', new JoiValidationPipe(Joi.isObjectId())) id: string,
    ) {
        try {
            const loginUser = req.loginUser;
            const cameraInfo = await this.cameraService.getCameraById(id);
            if (!cameraInfo) {
                const message = await this.i18n.translate(
                    'camera.get.wrong.id',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            // this login user is not a device admin
            if (!loginUser?.types?.includes(UserTypes.DEVICE_ADMIN)) {
                const canAccessCamera =
                    await this.cameraService.checkLoginUserCanAccessCamera(
                        id,
                        loginUser,
                    );

                if (!canAccessCamera) {
                    const message = await this.i18n.t(
                        'camera.loginUser.notAllow.access',
                    );

                    return new ErrorResponse(
                        HttpStatus.USER_CAN_NOT_ACCESS_RESOURCE,
                        message,
                    );
                }
            }
            const scheduleRepetitions =
                await this.schedulesService.findScheduleRepetitionsByCameraId(
                    id,
                );
            if (scheduleRepetitions?.totalItems > 0) {
                scheduleRepetitions?.items.forEach((scheduleRepetition) => {
                    this.schedulesService.deleteSchedulesInFuture(
                        scheduleRepetition._id,
                        req.loginUser.id,
                    );
                });
            }
            const kinesisDelete =
                await this.kinesisService.deleteSignalingChannel(
                    cameraInfo.kinesisChannelARN,
                );
            console.log('kinesisDelete', kinesisDelete);

            if (kinesisDelete) {
                const message = await this.i18n.translate(`errors.aws.connect`);
                return new ErrorResponse(HttpStatus.AWS_ERROR, message, []);
            }
            const deletedCamera = await this.cameraService.deleteCameraById(
                id,
                {
                    ...cameraInfo,
                    deletedAt: new Date(),
                    deletedBy: req.loginUser.id,
                },
            );
            await this.layoutService.deleteCameraInLayoutMap(id);
            if (deletedCamera) return new SuccessResponse(deletedCamera);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get()
    @Permissions(`${PermissionResources.CAMERA}_${PermissionActions.READ}`)
    @UseGuards(SetTreeUserGroupIdsGuard)
    async getCameraList(
        @Req() req,
        @Query(
            new JoiValidationPipe(CameraListQuerySchema),
            new RemoveEmptyQueryPipe(),
        )
        query: CameraListQueryDto,
    ) {
        try {
            const loginUser = req.loginUser;
            const cameraList = await this.cameraService.getCameraList(
                query,
                loginUser,
            );
            return new SuccessResponse(cameraList);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':id')
    @UseGuards(SetTreeUserGroupIdsGuard)
    @Permissions(
        `${PermissionResources.CAMERA}_${PermissionActions.READ}`,
        `${PermissionResources.CAMERA_GROUP}_${PermissionActions.READ}`,
    )
    async getCameraById(
        @Req() req,
        @Param('id', new JoiValidationPipe(Joi.isObjectId())) id: string,
    ) {
        try {
            const cameraInfo = await this.cameraService.getCameraById(id);
            if (!cameraInfo) {
                const message = await this.i18n.translate(
                    'camera.get.wrong.id',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const loginUser = req.loginUser;
            // this login user is not a device admin
            if (!loginUser?.types?.includes(UserTypes.DEVICE_ADMIN)) {
                const canAccessCamera =
                    await this.cameraService.checkLoginUserCanAccessCamera(
                        id,
                        loginUser,
                    );

                if (!canAccessCamera) {
                    const message = await this.i18n.t(
                        'camera.loginUser.notAllow.access',
                    );

                    return new ErrorResponse(
                        HttpStatus.USER_CAN_NOT_ACCESS_RESOURCE,
                        message,
                    );
                }
            }
            const camera = { ...cameraInfo } as CameraDetailResponseDto;
            if (cameraInfo?.userIds) {
                camera.usersInfo = (
                    (await this.iamUserService.getUsersList(
                        cameraInfo.userIds,
                    )) as IUserCVMResponse
                )?.items;
            }
            if (cameraInfo?.userGroupIds)
                camera.groupUserInfo = (
                    (await this.iamUserGroupService.getGroupUsersList(
                        cameraInfo.userGroupIds,
                    )) as IGroupUserCVMResponse
                )?.items;
            return new SuccessResponse(camera);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post(':id/refresh-status')
    async refreshConnectionStatus(
        @Param('id', new JoiValidationPipe(Joi.isObjectId())) id: string,
        @Body(new JoiValidationPipe(socketRefreshConnetionStatusSchema))
        body: ISocketRefreshConnectionStatusBody,
    ) {
        try {
            const camera = await this.cameraService.getCameraById(id);
            if (!camera) {
                const message = await this.i18n.t('camera.get.wrong.id');
                return new ErrorResponse(HttpStatus.ITEM_NOT_FOUND, message);
            }
            this.connectionStatusGateway.requestConnectionStatus(
                camera.uid,
                body.clientSocketRoom,
            );
            return new SuccessResponse({});
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post()
    @Permissions(`${PermissionResources.CAMERA}_${PermissionActions.CREATE}`)
    async createCamera(
        @Req() req,
        @Body(new JoiValidationPipe(CreateCameraSchema), new TrimBodyData())
        camera: CreateCameraDto,
    ) {
        try {
            const cameraInfo = { ...camera };
            cameraInfo.password = bcrypt.hashSync(
                cameraInfo.password,
                bcrypt.genSaltSync(10),
            );
            const [isSerialNumberExisted, isUidExisted] = await Promise.all([
                this.cameraService.checkCameraExisted(
                    SERIAL_NUMBER,
                    cameraInfo.serialNumber,
                ),
                this.cameraService.checkCameraExisted(UID, cameraInfo.uid),
            ]);
            if (isSerialNumberExisted) {
                const message = await this.i18n.translate(
                    `camera.create.serialNumber.duplicate`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'serialNumber',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }
            if (isUidExisted) {
                const message = await this.i18n.translate(
                    `camera.create.uid.duplicate`,
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'uid',
                        errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                        message,
                    },
                ]);
            }
            if (cameraInfo?.userName) {
                const isUserNameExisted =
                    await this.cameraService.checkCameraExisted(
                        USERNAME,
                        cameraInfo.userName,
                    );
                if (isUserNameExisted) {
                    const message = await this.i18n.translate(
                        `camera.create.userName.duplicate`,
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'userName',
                            errorCode: HttpStatus.ITEM_ALREADY_EXIST,
                            message,
                        },
                    ]);
                }
            }
            if (cameraInfo?.cameraGroups) {
                for (const cameraGroup of cameraInfo.cameraGroups) {
                    // Check max camera in one group
                    const numberOfGroup =
                        await this.cameraService.getNumberOfCameraInOneGroup(
                            cameraGroup,
                        );
                    if (numberOfGroup >= MAX_CAMERAS_IN_GROUP) {
                        const message = await this.i18n.translate(
                            `camera.create.max.children`,
                            { args: { max: MAX_CAMERAS_IN_GROUP } },
                        );
                        return new ErrorResponse(
                            HttpStatus.BAD_REQUEST,
                            message,
                            [
                                {
                                    key: 'cameraGroup',
                                    errorCode: HttpStatus.GROUP_MAX_QUANTITY,
                                    message,
                                },
                            ],
                        );
                    }
                }
            }
            const kinesisChannelARN =
                await this.kinesisService.createSignalingChannel(cameraInfo);
            if (!kinesisChannelARN) {
                const message = await this.i18n.translate(`errors.aws.connect`);
                return new ErrorResponse(HttpStatus.AWS_ERROR, message, []);
            }
            // parse camera data
            const newCamera = {
                ...cameraInfo,
                kinesisChannelARN,
            };

            if (!cameraInfo?.userName)
                newCamera.cameraGroups = cameraInfo.cameraGroups;
            else newCamera.userName = cameraInfo.userName;
            const createdCamera = await this.cameraService.createCamera({
                ...newCamera,
                createdBy: req.loginUser.id,
            });
            return new SuccessResponse(createdCamera);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(':id')
    @UseGuards(SetTreeUserGroupIdsGuard)
    @Permissions(`${PermissionResources.CAMERA}_${PermissionActions.UPDATE}`)
    async updateCamera(
        @Req() req,
        @Param('id', new JoiValidationPipe(Joi.isObjectId())) id: string,
        @Body(new JoiValidationPipe(UpdateCameraSchema), new TrimBodyData())
        body: UpdateCameraDto,
    ) {
        try {
            const loginUser = req.loginUser;
            const camera = await this.cameraService.getCameraById(id);
            if (!camera) {
                const message = await this.i18n.translate(
                    'camera.get.wrong.id',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            // this login user is not a device admin
            if (!loginUser?.types?.includes(UserTypes.DEVICE_ADMIN)) {
                const canAccessCamera =
                    await this.cameraService.checkLoginUserCanAccessCamera(
                        id,
                        loginUser,
                    );

                if (!canAccessCamera) {
                    const message = await this.i18n.t(
                        'camera.loginUser.notAllow.access',
                    );

                    return new ErrorResponse(
                        HttpStatus.USER_CAN_NOT_ACCESS_RESOURCE,
                        message,
                    );
                }
            }
            if (body?.cameraGroups) {
                for (const cameraGroup of body.cameraGroups) {
                    // Check group existed
                    const cameraGroupInfo =
                        await this.cameraGroupService.getGroupCameraById(
                            new ObjectId(cameraGroup),
                        );
                    if (!cameraGroupInfo) {
                        const message = await this.i18n.translate(
                            `camera.update.group.existed`,
                        );
                        return new ErrorResponse(
                            HttpStatus.BAD_REQUEST,
                            message,
                            [
                                {
                                    key: 'cameraGroupId',
                                    errorCode: HttpStatus.ITEM_NOT_FOUND,
                                    message,
                                },
                            ],
                        );
                    }
                    // Check max group in same parent
                    const numberOfGroup =
                        await this.cameraService.getNumberOfCameraInOneGroup(
                            cameraGroup,
                            new ObjectId(id),
                        );
                    if (numberOfGroup >= MAX_CAMERAS_IN_GROUP) {
                        const message = await this.i18n.translate(
                            `camera.create.max.children`,
                            { args: { max: MAX_CAMERAS_IN_GROUP } },
                        );
                        return new ErrorResponse(
                            HttpStatus.BAD_REQUEST,
                            message,
                            [
                                {
                                    key: 'id',
                                    errorCode: HttpStatus.GROUP_MAX_QUANTITY,
                                    message,
                                },
                            ],
                        );
                    }
                }
            }
            // check if any userIds in request are invalid
            if (body.userIds?.length > 0) {
                const userIds = (await this.iamUserService.getUsersList(
                    body.userIds,
                )) as IUserCVMResponse;
                if (userIds?.items.length !== body.userIds.length) {
                    const message = await this.i18n.translate(
                        `camera.get.wrong.userIds`,
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'userIds',
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                            message,
                        },
                    ]);
                }
            }
            // check if any userGroupIds in request are invalid
            if (body.userGroupIds?.length > 0) {
                const userGroupIds =
                    (await this.iamUserGroupService.getGroupUsersList(
                        body.userGroupIds,
                    )) as IGroupUserCVMResponse;
                if (userGroupIds?.items.length !== body.userGroupIds.length) {
                    const message = await this.i18n.translate(
                        `camera.get.wrong.userGroupIds`,
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'userGroupIds',
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                            message,
                        },
                    ]);
                }
            }
            const cameraResult = { ...body, updatedBy: req.loginUser.id };
            const newCamera = await this.cameraService.updateCameraById(
                id,
                cameraResult,
                {
                    returnDocument: 'after',
                },
            );
            if (newCamera) return new SuccessResponse(newCamera);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post('request-onvif-profile')
    @Permissions(
        `${PermissionResources.CAMERA_GROUP}_${PermissionActions.CREATE}`,
    )
    async getOnvifProfile(
        @Body(new JoiValidationPipe(OnvifRequestSchema), new TrimBodyData())
        onvifRequestBody: OnvifRequestDto,
    ) {
        try {
            this.onvifGateway.requestOnvifProfile({
                cameraUid: onvifRequestBody.uid,
                cameraUsername: onvifRequestBody.username,
                cameraPassword: onvifRequestBody.password,
                clientSocketRoom: onvifRequestBody.clientSocketRoom,
            });
            return new SuccessResponse({});
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post(':id/recording-configuration')
    @UseGuards(SetTreeUserGroupIdsGuard)
    @Permissions(`${PermissionResources.CAMERA}_${PermissionActions.CONFIG}`)
    async updateCameraRecordingConfiguration(
        @Req() req,
        @Body(new JoiValidationPipe(UpdateCameraRecordingConfigurationSchema))
        body: UpdateCameraRecordingConfigurationDto,
        @Param('id', new JoiValidationPipe(Joi.isObjectId())) id: string,
    ) {
        try {
            const camera = await this.cameraService.getCameraById(id);
            const loginUser = req.loginUser;
            if (!camera) {
                const message = await this.i18n.translate(
                    'camera.get.wrong.id',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            // this login user is not a device admin
            if (!loginUser?.types?.includes(UserTypes.DEVICE_ADMIN)) {
                const canAccessCamera =
                    await this.cameraService.checkLoginUserCanAccessCamera(
                        id,
                        loginUser,
                    );

                if (!canAccessCamera) {
                    const message = await this.i18n.t(
                        'camera.loginUser.notAllow.access',
                    );

                    return new ErrorResponse(
                        HttpStatus.USER_CAN_NOT_ACCESS_RESOURCE,
                        message,
                    );
                }
            }
            const cameraDetail =
                await this.cameraService.updateCameraRecordingConfiguration(
                    id,
                    body,
                );
            return new SuccessResponse(cameraDetail);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
