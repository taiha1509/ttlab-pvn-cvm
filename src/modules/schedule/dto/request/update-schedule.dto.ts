import Joi from 'src/plugins/joi';
import { DateFormat } from 'src/common/constants';
import { ScheduleRepeatType, Weekday } from '../../schedule.constant';
import { CameraScheduleConfigurationSchema } from './create-schedule.dto';

export class UpdateScheduleRepetitionDto {
    originalSchedule?: string;
    initStartAt: Date;
    initEndAt: Date;
    repeatType: ScheduleRepeatType;
    repeatEndDate: Date;
    repeatDays: Weekday[];
    updatedBy: number;
}

export class UpdateScheduleDto {
    camera?: string;
    scheduleRepetition?: string;
    startAt?: Date;
    endAt?: Date;
    updatedBy?: number;
}

export class UpdateCameraScheduleConfigurationDto {
    cameraId: string;
    initStartAt: string | Date;
    initEndAt: string | Date;
    repeatType: ScheduleRepeatType;
    repeatEndDate: string | Date;
    repeatDays: Weekday[];
    recordAtServer: boolean;
}

export const UpdateCameraScheduleConfigurationSchema = Joi.object().keys({
    cameraId: Joi.isObjectId().required(),
    initStartAt: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV)
        .required(),
    ...CameraScheduleConfigurationSchema,
});
