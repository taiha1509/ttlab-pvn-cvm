import Joi from 'src/plugins/joi';
import {
    DateFormat,
    DEFAULT_MAX_DATE,
    DEFAULT_MIN_DATE,
} from 'src/common/constants';
import {
    ScheduleRepeatType,
    Weekday,
    weekdaysByRepeatType,
} from '../../schedule.constant';
import moment from 'moment';

export class CreateScheduleRepetitionDto {
    camera: string;
    originalSchedule?: string;
    initStartAt: string | Date;
    initEndAt: string | Date;
    repeatType: ScheduleRepeatType;
    repeatEndDate: string | Date;
    repeatDays: Weekday[];
    createdBy: number;
}

export class CreateScheduleDto {
    camera: string;
    scheduleRepetition?: string;
    startAt: string | Date;
    endAt: string | Date;
    createdBy: number;
}

const RepeatDaysByRepeatTypeSchema = Joi.when('repeatType', {
    switch: [
        {
            is: ScheduleRepeatType.DAILY,
            then: Joi.array()
                .items(
                    Joi.string().valid(
                        ...weekdaysByRepeatType[ScheduleRepeatType.DAILY],
                    ),
                )
                .unique(),
        },
        {
            is: ScheduleRepeatType.WEEKEND,
            then: Joi.array()
                .items(
                    Joi.string().valid(
                        ...weekdaysByRepeatType[ScheduleRepeatType.WEEKEND],
                    ),
                )
                .unique(),
        },
        {
            is: ScheduleRepeatType.WORKDAY,
            then: Joi.array()
                .items(
                    Joi.string().valid(
                        ...weekdaysByRepeatType[ScheduleRepeatType.WORKDAY],
                    ),
                )
                .unique(),
        },
        {
            is: ScheduleRepeatType.ONCE,
            then: Joi.array().length(0).allow(null),
        },
        {
            is: ScheduleRepeatType.CUSTOM,
            then: Joi.array()
                .items(Joi.string().valid(...Object.values(Weekday)))
                .unique()
                .min(1)
                .required(),
        },
    ],
});

export const CameraScheduleConfigurationSchema = {
    initEndAt: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV)
        .greater(Joi.ref('initStartAt'))
        .min(
            moment(DEFAULT_MIN_DATE).format(
                DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV,
            ),
        )
        .max(
            moment(DEFAULT_MAX_DATE).format(
                DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV,
            ),
        )
        .required(),
    repeatType: Joi.string()
        .valid(...Object.values(ScheduleRepeatType))
        .required(),
    repeatEndDate: Joi.date()
        .greater(Joi.ref('initStartAt'))
        .greater(Joi.ref('initEndAt'))
        .min(
            moment(DEFAULT_MIN_DATE).format(
                DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV,
            ),
        )
        .max(
            moment(DEFAULT_MAX_DATE).format(
                DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV,
            ),
        )
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV)
        .required(),
    recordAtServer: Joi.boolean().required(),
    repeatDays: RepeatDaysByRepeatTypeSchema,
};

export class CreateCameraScheduleConfigurationDto {
    initStartAt: string | Date;
    initEndAt: string | Date;
    repeatType: ScheduleRepeatType;
    repeatEndDate: string | Date;
    repeatDays: Weekday[];
    recordAtServer: boolean;
}

export const CreateCameraScheduleConfigurationSchema = Joi.object().keys({
    initStartAt: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV)
        .greater('now')
        .min(
            moment(DEFAULT_MIN_DATE).format(
                DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV,
            ),
        )
        .max(
            moment(DEFAULT_MAX_DATE).format(
                DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV,
            ),
        )
        .required(),
    ...CameraScheduleConfigurationSchema,
});
