import {
    Body,
    Controller,
    Get,
    InternalServerErrorException,
    Param,
    Post,
    Req,
    Headers,
    UseGuards,
    Delete,
    Patch,
} from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { ScheduleService } from './service/schedule.service';
import { MODULE_NAME, ScheduleTarget } from './schedule.constant';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { JoiValidationPipe } from 'src/common/pipes/joi.validation.pipe';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import {
    checkChangingScheduleTimeInThePast,
    getTimeOfSchedules,
} from './schedule.helper';
import {
    convertTimeToUTC,
    isEndOfDay,
} from 'src/common/helpers/commonFunctions';
import { ROUTER_PREFIX_APP } from 'src/modules/common/common.constant';
import { HttpStatus, UserTypes } from 'src/common/constants';
import {
    PermissionActions,
    PermissionResources,
    Permissions,
    TIMEZONE_NAME_HEADER,
} from 'src/common/constants';
import Joi from 'src/plugins/joi';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import {
    CreateCameraScheduleConfigurationDto,
    CreateCameraScheduleConfigurationSchema,
} from './dto/request/create-schedule.dto';
import moment from 'moment';
import {
    UpdateCameraScheduleConfigurationDto,
    UpdateCameraScheduleConfigurationSchema,
} from './dto/request/update-schedule.dto';
import { RoleGuard } from 'src/common/guards/role.guard';
import { CameraMongoService } from '../camera/service/cameraMongo.service';
import { SchedulesGateway } from '../device-controller/sockets/schedules.gateway';
import { SetTreeUserGroupIdsGuard } from 'src/common/guards/camera.guard';

@Controller(`/${ROUTER_PREFIX_APP}`)
@UseGuards(JwtGuard, RoleGuard)
export class ScheduleController {
    constructor(
        private readonly scheduleService: ScheduleService,
        private readonly configService: ConfigService,
        private readonly cameraService: CameraMongoService,
        private readonly i18n: I18nRequestScopeService,
        private readonly scheduleGateway: SchedulesGateway,
    ) {
        // eslint-disable-next-line prettier/prettier
    }

    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    @Get(`camera/:cameraId/schedule-configuration`)
    @UseGuards(SetTreeUserGroupIdsGuard)
    @Permissions(`${PermissionResources.CAMERA}_${PermissionActions.READ}`)
    async getCameraScheduleConfigurationList(
        @Req() req,
        @Param('cameraId', new JoiValidationPipe(Joi.isObjectId()))
        cameraId: string,
    ) {
        try {
            const isCameraExist = await this.scheduleService.checkCameraExist(
                cameraId,
            );
            const loginUser = req.loginUser;
            if (!isCameraExist) {
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    await this.i18n.translate('schedule.error.notFoundCamera'),
                );
            }
            // this login user is not a device admin
            if (!loginUser?.types?.includes(UserTypes.DEVICE_ADMIN)) {
                const canAccessCamera =
                    await this.cameraService.checkLoginUserCanAccessCamera(
                        cameraId,
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
            const result =
                await this.scheduleService.findScheduleRepetitionsByCameraId(
                    cameraId,
                );
            return new SuccessResponse(result);
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleController.name} - getCameraScheduleConfigurationList func: `,
                error,
            );
            throw new InternalServerErrorException(error);
        }
    }

    @Get(`camera/schedule-configuration/:id`)
    @Permissions(`${PermissionResources.CAMERA}_${PermissionActions.READ}`)
    async getCameraScheduleConfigurationDetail(
        @Param('id', new JoiValidationPipe(Joi.isObjectId()))
        id: string,
    ) {
        try {
            const [scheduleRepetition] = await Promise.all([
                this.scheduleService.findScheduleRepetitionById(id),
            ]);
            if (!scheduleRepetition) {
                const message = await this.i18n.translate(
                    'schedule.error.notFoundSchedule',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse(scheduleRepetition);
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleController.name} - getCameraScheduleConfigurationDetail func: `,
                error,
            );
            throw new InternalServerErrorException(error);
        }
    }

    @Post(`camera/:cameraId/schedule-configuration`)
    @UseGuards(SetTreeUserGroupIdsGuard)
    @Permissions(`${PermissionResources.CAMERA}_${PermissionActions.CONFIG}`)
    async createCameraScheduleConfiguration(
        @Headers(TIMEZONE_NAME_HEADER) timezoneName: string,
        @Req() req,
        @Param('cameraId', new JoiValidationPipe(Joi.isObjectId()))
        cameraId: string,
        @Body(new JoiValidationPipe(CreateCameraScheduleConfigurationSchema))
        body: CreateCameraScheduleConfigurationDto,
    ) {
        try {
            const isCameraExist = await this.scheduleService.checkCameraExist(
                cameraId,
            );
            const loginUser = req.loginUser;
            if (!isCameraExist) {
                const message = await this.i18n.translate(
                    'schedule.error.notFoundCamera',
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
                        cameraId,
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
            // if (!isEndOfDay(body.repeatEndDate, timezoneName)) {
            //     const message = await this.i18n.translate(
            //         'schedule.post.invalidEndDate',
            //     );
            //     return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
            //         {
            //             key: 'repeatEndDate',
            //             errorCode: HttpStatus.BAD_REQUEST,
            //             message,
            //         },
            //     ]);
            // }
            const scheduleTimes = getTimeOfSchedules({
                initStartAt: body.initStartAt,
                initEndAt: body.initEndAt,
                repeatEndDate: body.repeatEndDate,
                repeatType: body.repeatType,
                repeatDays: body.repeatDays,
            });
            const isTimeOverlapped =
                await this.scheduleService.checkSchedulesOverlapped(
                    scheduleTimes,
                    cameraId,
                );
            if (isTimeOverlapped) {
                const message = await this.i18n.translate(
                    'schedule.error.overlapped',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'scheduleTime',
                        errorCode: HttpStatus.BAD_REQUEST,
                        message,
                    },
                ]);
            }
            const scheduleRepetition = {
                initStartAt: convertTimeToUTC(body.initStartAt),
                initEndAt: convertTimeToUTC(body.initEndAt),
                repeatEndDate: convertTimeToUTC(body.repeatEndDate),
                repeatType: body.repeatType,
                repeatDays: body.repeatDays,
                recordAtServer: body?.recordAtServer,
                camera: cameraId,
                createdBy: req?.loginUser?.id,
            };
            const schedules = scheduleTimes.map((time) => ({
                ...time,
                camera: cameraId,
                target: ScheduleTarget.SINGLE,
                createdBy: req?.loginUser?.id,
            }));
            const result = await this.scheduleService.createAndRepeatSchedules(
                schedules,
                scheduleRepetition,
            );
            await this.scheduleService.sendSchedulesToCamera(cameraId);
            return new SuccessResponse(result);
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleController.name} - createCameraScheduleConfiguration func: `,
                error,
            );
            throw new InternalServerErrorException(error);
        }
    }

    @Patch(`camera/schedule-configuration/:id`)
    @Permissions(`${PermissionResources.CAMERA}_${PermissionActions.CONFIG}`)
    async updateCameraScheduleConfiguration(
        @Headers(TIMEZONE_NAME_HEADER) timezoneName: string,
        @Req() req,
        @Param('id', new JoiValidationPipe(Joi.isObjectId()))
        id: string,
        @Body(new JoiValidationPipe(UpdateCameraScheduleConfigurationSchema))
        body: UpdateCameraScheduleConfigurationDto,
    ) {
        try {
            const [scheduleRepetition] = await Promise.all([
                this.scheduleService.findScheduleRepetitionById(id),
            ]);
            if (!scheduleRepetition) {
                const message = await this.i18n.translate(
                    'schedule.error.notFoundSchedule',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const isRecording =
                await this.scheduleService.checkAnyScheduleIsRecording(id);
            if (isRecording) {
                const message = await this.i18n.translate(
                    'schedule.error.scheduleIsUpdateRecording',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'endAt',
                        errorCode: HttpStatus.BAD_REQUEST,
                        message,
                    },
                ]);
            }
            if (checkChangingScheduleTimeInThePast(scheduleRepetition, body)) {
                const message = await this.i18n.translate(
                    'schedule.error.notChangeTimeInPast',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'scheduleTime',
                        errorCode: HttpStatus.BAD_REQUEST,
                        message,
                    },
                ]);
            }
            // if (!isEndOfDay(body.repeatEndDate, timezoneName)) {
            //     const message = await this.i18n.translate(
            //         'schedule.post.invalidEndDate',
            //     );
            //     return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
            //         {
            //             key: 'repeatEndDate',
            //             errorCode: HttpStatus.BAD_REQUEST,
            //             message,
            //         },
            //     ]);
            // }
            // creating new schedules in the future
            const scheduleTimes = getTimeOfSchedules({
                initStartAt: body.initStartAt,
                initEndAt: body.initEndAt,
                repeatEndDate: body.repeatEndDate,
                repeatType: body.repeatType,
                repeatDays: body.repeatDays,
            }).filter((scheduleTime) =>
                moment(scheduleTime.startAt).isAfter(moment()),
            );
            if (scheduleTimes.length) {
                const isTimeOverlapped =
                    await this.scheduleService.checkSchedulesOverlapped(
                        scheduleTimes,
                        body.cameraId,
                        id,
                    );
                if (isTimeOverlapped) {
                    const message = await this.i18n.translate(
                        'schedule.error.overlapped',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'scheduleTime',
                            errorCode: HttpStatus.BAD_REQUEST,
                            message,
                        },
                    ]);
                }
            }
            const scheduleRepetitionData = {
                initStartAt: convertTimeToUTC(body.initStartAt),
                initEndAt: convertTimeToUTC(body.initEndAt),
                repeatEndDate: convertTimeToUTC(body.repeatEndDate),
                repeatType: body.repeatType,
                repeatDays: body.repeatDays,
                recordAtServer: body?.recordAtServer,
                updatedBy: req?.loginUser?.id,
            };
            const schedules = scheduleTimes.map((time) => ({
                ...time,
                scheduleRepetition: id,
                camera: body.cameraId,
                target: ScheduleTarget.SINGLE,
                createdBy: req?.loginUser?.id,
            }));
            const result = await this.scheduleService.updateAndRepeatSchedules(
                id,
                schedules,
                scheduleRepetitionData,
                req?.loginUser?.id,
            );
            await this.scheduleService.sendSchedulesToCamera(body.cameraId);
            return new SuccessResponse(result);
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleController.name} - createCameraScheduleConfiguration func: `,
                error,
            );
            throw new InternalServerErrorException(error);
        }
    }

    @Delete(`camera/schedule-configuration/:id`)
    @Permissions(`${PermissionResources.CAMERA}_${PermissionActions.CONFIG}`)
    async deleteCameraScheduleConfiguration(
        @Req() req,
        @Param('id', new JoiValidationPipe(Joi.isObjectId()))
        id: string,
    ) {
        try {
            const scheduleRepetition =
                await this.scheduleService.findScheduleRepetitionById(id);
            if (!scheduleRepetition) {
                const message = await this.i18n.translate(
                    'schedule.error.notFoundSchedule',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            const isInvalid =
                await this.scheduleService.checkAnyScheduleIsAboutToStart(id);
            if (isInvalid) {
                const message = await this.i18n.translate(
                    'schedule.error.scheduleIsAboutToStart',
                    {
                        args: {
                            time: Math.ceil(
                                moment(scheduleRepetition.initStartAt).diff(
                                    moment(),
                                    'minutes',
                                ),
                            ),
                        },
                    },
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'startAt',
                        errorCode: HttpStatus.BAD_REQUEST,
                        message,
                    },
                ]);
            }
            const isRecording =
                await this.scheduleService.checkAnyScheduleIsRecording(id);
            if (isRecording) {
                const message = await this.i18n.translate(
                    'schedule.error.scheduleIsDeleteRecording',
                );
                return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                    {
                        key: 'endAt',
                        errorCode: HttpStatus.BAD_REQUEST,
                        message,
                    },
                ]);
            }
            await this.scheduleService.deleteSchedulesInFuture(
                id,
                req.loginUser?.id,
            );
            await this.scheduleService.sendSchedulesToCamera(
                scheduleRepetition.camera.toString(),
            );
            return new SuccessResponse();
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleController.name} - deleteCameraScheduleConfiguration func: `,
                error,
            );
            throw new InternalServerErrorException(error);
        }
    }
}
