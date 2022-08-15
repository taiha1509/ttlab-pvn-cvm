import { Model, Connection, SaveOptions, QueryOptions } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Schedule, ScheduleDocument } from '../schema/schedule.schema';
import moment from 'moment';
import mongodb, { ObjectId } from 'mongodb';
import {
    ICameraSchedule,
    MODULE_NAME,
    SECONDS_BETWEEN_SCHEDULES,
} from '../schedule.constant';
import {
    ScheduleRepetition,
    ScheduleRepetitionDocument,
} from '../schema/scheduleRepetition.schema';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { ConfigService } from '@nestjs/config';
import {
    Camera,
    CameraDocument,
} from 'src/modules/camera/schema/camera.schema';
import {
    CreateScheduleDto,
    CreateScheduleRepetitionDto,
} from '../dto/request/create-schedule.dto';
import {
    UpdateScheduleDto,
    UpdateScheduleRepetitionDto,
} from '../dto/request/update-schedule.dto';
import { Encoding, Resolution } from 'src/modules/camera/camera.constant';
import ConfigKey from 'src/common/config/config-key';
import { CameraMongoService } from 'src/modules/camera/service/cameraMongo.service';
import { SchedulesGateway } from 'src/modules/device-controller/sockets/schedules.gateway';

@Injectable()
export class ScheduleService {
    constructor(
        @InjectModel(Camera.name)
        private cameraModel: Model<CameraDocument>,
        @InjectModel(Schedule.name)
        private scheduleModel: Model<ScheduleDocument>,
        @InjectModel(ScheduleRepetition.name)
        private scheduleRepetitionModel: Model<ScheduleRepetitionDocument>,
        @InjectConnection() private readonly connection: Connection,
        private readonly configService: ConfigService,
        private readonly cameraSerivce: CameraMongoService,
        private readonly scheduleGateway: SchedulesGateway,
    ) {
        // eslint-disable-next-line prettier/prettier
    }

    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    async checkCameraExist(cameraId: string) {
        try {
            const count = await this.cameraModel.count({
                _id: cameraId,
                deletedAt: null,
            });
            return count > 0;
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleService.name} - checkCameraExist func: `,
                error,
            );
            throw error;
        }
    }

    async findSchedulesByCameraId(cameraId: string) {
        try {
            const conditions = {
                camera: cameraId,
                endAt: {
                    $lte: moment()
                        .add(
                            this.configService.get(
                                ConfigKey.MAX_SCHEDULES_IN_FUTURE_DAYS,
                            ),
                            'days',
                        )
                        .toDate(),
                    $gte: moment().toDate(),
                },
                deletedAt: null,
            };
            const items = await this.scheduleModel
                .find(conditions)
                .select(['_id', 'startAt', 'endAt']);
            return items;
        } catch (error) {
            throw error;
        }
    }

    async sendSchedulesToCamera(cameraId: string) {
        const camera = await this.cameraSerivce.getCameraForScheduleUpdateById(
            new ObjectId(cameraId),
        );
        if (camera) {
            const scheduleInformation =
                await this.getSchedulesDataWithRecordingConfiguration(camera);
            this.scheduleGateway.sendSchedules(
                camera?.uid,
                scheduleInformation,
            );
        }
    }

    async getSchedulesDataWithRecordingConfiguration(camera: ICameraSchedule) {
        const cameraSchedules = await this.findSchedulesByCameraId(camera._id);
        return {
            schedules: cameraSchedules,
            recordingConfiguration: {
                hasAudio: camera.recordingConfiguration?.hasAudio || false,
                gpsLocate: camera.recordingConfiguration?.gpsLocate || false,
                encoding:
                    camera.recordingConfiguration?.encoding || Encoding.NONE,
                resolution:
                    camera.recordingConfiguration?.resolution ||
                    Resolution.R_1080,
            },
        };
    }

    async findScheduleRepetitionsByCameraId(cameraId: string) {
        try {
            const conditions = {
                camera: cameraId,
                deletedAt: null,
            };
            const [items, totalItems] = await Promise.all([
                this.scheduleRepetitionModel.find(conditions),
                this.scheduleRepetitionModel.count(conditions),
            ]);
            return { items, totalItems };
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleService.name} - findScheduleRepetitionsByCameraId func: `,
                error,
            );
            throw error;
        }
    }

    async findScheduleRepetitionById(_id: string) {
        try {
            const data = await this.scheduleRepetitionModel.findOne({
                _id,
                deletedAt: null,
            });
            return data;
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleService.name} - findScheduleRepetitionById func: `,
                error,
            );
            throw error;
        }
    }

    async createSchedule(
        createSchedule: CreateScheduleDto,
        options?: SaveOptions,
    ): Promise<ScheduleDocument> {
        try {
            const scheduleModel = new this.scheduleModel(createSchedule);
            return await scheduleModel.save(options);
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleService.name} - createSchedule func: `,
                error,
            );
            throw error;
        }
    }

    async bulkCreateSchedules(
        createSchedules: CreateScheduleDto[],
        options: mongodb.BulkWriteOptions,
    ) {
        try {
            const createScheduleOperators = createSchedules.map((document) => ({
                insertOne: { document },
            }));
            const result = await this.scheduleModel.bulkWrite(
                createScheduleOperators,
                options,
            );
            const insertedIds = result.getInsertedIds() || [];
            return insertedIds.map((item) => item._id) as ObjectId[];
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleService.name} - bulkCreateSchedules func: `,
                error,
            );
            throw error;
        }
    }

    async updateScheduleById(
        id: string,
        data: UpdateScheduleDto,
        options?: QueryOptions,
    ): Promise<ScheduleDocument> {
        try {
            const updatedSchedule = await this.scheduleModel.findByIdAndUpdate(
                id,
                data,
                options,
            );
            return updatedSchedule;
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleService.name} - updateScheduleById func: `,
                error,
            );
            throw error;
        }
    }

    async createScheduleRepetition(
        createScheduleRepetition: CreateScheduleRepetitionDto,
        options?: SaveOptions,
    ) {
        try {
            const data = new this.scheduleRepetitionModel(
                createScheduleRepetition,
            );
            return await data.save(options);
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleService.name} - createScheduleRepetition func: `,
                error,
            );
            throw error;
        }
    }

    async updateScheduleRepetitionById(
        id: string,
        data: UpdateScheduleRepetitionDto,
        options?: SaveOptions,
    ) {
        try {
            const result = await this.scheduleRepetitionModel.findByIdAndUpdate(
                id,
                data,
                options,
            );
            return result;
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleService.name} - updateScheduleRepetitionById func: `,
                error,
            );
            throw error;
        }
    }

    async checkSchedulesOverlapped(
        scheduleTimes: { startAt: string | Date; endAt: string | Date }[],
        cameraId: string,
        notRepetitionId?: string,
    ) {
        try {
            if (!cameraId) return false;
            const overlappedTime = scheduleTimes.map((schedule) => {
                return {
                    startAt: {
                        $lt: moment(schedule.endAt)
                            .add(SECONDS_BETWEEN_SCHEDULES, 'seconds')
                            .toDate(),
                    },
                    endAt: {
                        $gt: moment(schedule.startAt)
                            .subtract(SECONDS_BETWEEN_SCHEDULES, 'seconds')
                            .toDate(),
                    },
                };
            });
            const conditions = {
                camera: cameraId,
                $or: overlappedTime,
                deletedAt: null,
            };
            if (notRepetitionId)
                Object.assign(conditions, {
                    scheduleRepetition: { $ne: notRepetitionId },
                });
            const countSchedule = await this.scheduleModel.count(conditions);
            return countSchedule > 0;
        } catch (error) {
            this.logger.error(
                'Error in checkSchedulesOverlapped func: ',
                error,
            );
            throw error;
        }
    }

    async createAndRepeatSchedules(
        createSchedules: CreateScheduleDto[],
        createScheduleRepetition: CreateScheduleRepetitionDto,
    ) {
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            const [rootSchedule, ...repeatedSchedules] = createSchedules;
            const createdRootSchedule = await this.createSchedule(
                rootSchedule,
                {
                    session,
                },
            );
            const scheduleRepetition = await this.createScheduleRepetition(
                {
                    ...createScheduleRepetition,
                    originalSchedule: createdRootSchedule._id.toString(),
                },
                { session },
            );
            if (repeatedSchedules?.length) {
                const data = repeatedSchedules.map((schedule) => ({
                    ...schedule,
                    scheduleRepetition: scheduleRepetition._id.toString(),
                }));
                await this.bulkCreateSchedules(data, { session });
            }
            await this.updateScheduleById(
                createdRootSchedule._id,
                {
                    scheduleRepetition: scheduleRepetition._id.toString(),
                },
                { session },
            );
            await session.commitTransaction();
            return scheduleRepetition;
        } catch (error) {
            await session.abortTransaction();
            this.logger.error(
                `Error in ${ScheduleService.name} - createAndRepeatSchedules func: `,
                error,
            );
            throw error;
        } finally {
            session.endSession();
        }
    }

    async updateAndRepeatSchedules(
        scheduleRepetitionId: string,
        createSchedules: CreateScheduleDto[],
        updateScheduleRepetition: UpdateScheduleRepetitionDto,
        deletedBy: number,
    ) {
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            const scheduleRepetition = await this.updateScheduleRepetitionById(
                scheduleRepetitionId,
                updateScheduleRepetition,
                { session },
            );
            // delete schedules having startAt >= now + buffer time
            const deleteSchedulesOperator = {
                updateMany: {
                    filter: {
                        scheduleRepetition: scheduleRepetitionId,
                        startAt: {
                            $gte: moment()
                                .add(SECONDS_BETWEEN_SCHEDULES, 'seconds')
                                .toDate(),
                        },
                    },
                    update: { deletedAt: new Date(), deletedBy },
                },
            };
            // insert new schedules
            const createSchedulesOperator = createSchedules.map((schedule) => ({
                insertOne: {
                    document: schedule,
                },
            }));
            await this.scheduleModel.bulkWrite(
                [deleteSchedulesOperator, ...createSchedulesOperator],
                { session },
            );
            await session.commitTransaction();
            return scheduleRepetition;
        } catch (error) {
            await session.abortTransaction();
            this.logger.error(
                `Error in ${ScheduleService.name} - updateAndRepeatSchedules func: `,
                error,
            );
            throw error;
        } finally {
            session.endSession();
        }
    }

    async checkAnyScheduleIsAboutToStart(scheduleRepetitionId: string) {
        try {
            const count = await this.scheduleModel.count({
                scheduleRepetition: scheduleRepetitionId,
                startAt: {
                    $gte: moment().toDate(),
                    $lt: moment()
                        .add(SECONDS_BETWEEN_SCHEDULES, 'seconds')
                        .toDate(),
                },
                deletedAt: null,
            });
            return count > 0;
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleService.name} - checkAnyScheduleIsAboutToStart func: `,
                error,
            );
            throw error;
        }
    }

    async checkAnyScheduleIsRecording(scheduleRepetitionId: string) {
        try {
            const count = await this.scheduleModel.count({
                scheduleRepetition: scheduleRepetitionId,
                $and: [
                    {
                        startAt: {
                            $lt: moment().toDate(),
                        },
                    },
                    {
                        endAt: {
                            $gte: moment().toDate(),
                        },
                    },
                ],
                deletedAt: null,
            });
            return count > 0;
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleService.name} - checkAnyScheduleIsAboutToStart func: `,
                error,
            );
            throw error;
        }
    }

    async checkCameraHasRecordingSchedule(id: string): Promise<boolean> {
        try {
            const schedules = await this.scheduleRepetitionModel.find({
                camera: id,
                deletedAt: { $eq: null },
            });
            if (schedules?.length > 0) {
                for (const schedule of schedules) {
                    const isRecording = this.checkAnyScheduleIsRecording(
                        schedule._id,
                    );
                    if (isRecording) return isRecording;
                }
            }
        } catch (error) {
            this.logger.debug('Error in delete camera in schedule', error);
            throw error;
        }
    }

    async deleteSchedulesInFuture(
        scheduleRepetitionId: string,
        deletedBy: number,
    ) {
        try {
            await Promise.all([
                this.scheduleRepetitionModel.updateOne(
                    { _id: scheduleRepetitionId },
                    { deletedBy, deletedAt: new Date() },
                ),
                this.scheduleModel.updateMany(
                    {
                        scheduleRepetition: scheduleRepetitionId,
                        startAt: {
                            $gte: moment()
                                .add(SECONDS_BETWEEN_SCHEDULES, 'seconds')
                                .toDate(),
                        },
                    },
                    { deletedBy, deletedAt: new Date() },
                ),
            ]);
        } catch (error) {
            this.logger.error(
                `Error in ${ScheduleService.name} - deleteSchedulesInFuture func: `,
                error,
            );
            throw error;
        }
    }
}
