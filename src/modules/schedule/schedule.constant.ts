import { CameraRecordingConfiguration } from '../camera/dto/type';

export const MODULE_NAME = 'schedule';
export const SECONDS_BETWEEN_SCHEDULES = 300; // 5 minutes by seconds

export enum ScheduleRepeatType {
    ONCE = 'once', // (default)
    DAILY = 'daily',
    WEEKEND = 'weekend', // (t7, cn)
    WORKDAY = 'workday', // (t2 -> t6)
    CUSTOM = 'custom',
}

export enum Weekday {
    MONDAY = 'monday',
    TUESDAY = 'tuesday',
    WEDNESDAY = 'wednesday',
    THURSDAY = 'thursday',
    FRIDAY = 'friday',
    SATURDAY = 'saturday',
    SUNDAY = 'sunday',
}

export const WEEKDAY_INDEX = {
    [Weekday.MONDAY]: 1,
    [Weekday.TUESDAY]: 2,
    [Weekday.WEDNESDAY]: 3,
    [Weekday.THURSDAY]: 4,
    [Weekday.FRIDAY]: 5,
    [Weekday.SATURDAY]: 6,
    [Weekday.SUNDAY]: 0,
};

export enum ScheduleTarget {
    SINGLE = 'single',
    GROUP = 'group',
}

export const weekdaysByRepeatType = {
    [ScheduleRepeatType.DAILY]: [
        Weekday.MONDAY,
        Weekday.TUESDAY,
        Weekday.WEDNESDAY,
        Weekday.THURSDAY,
        Weekday.FRIDAY,
        Weekday.SATURDAY,
        Weekday.SUNDAY,
    ],
    [ScheduleRepeatType.WORKDAY]: [
        Weekday.MONDAY,
        Weekday.TUESDAY,
        Weekday.WEDNESDAY,
        Weekday.THURSDAY,
        Weekday.FRIDAY,
    ],
    [ScheduleRepeatType.WEEKEND]: [Weekday.SATURDAY, Weekday.SUNDAY],
    [ScheduleRepeatType.ONCE]: [],
};

export interface ICameraSchedule {
    _id: string;
    recordingConfiguration: CameraRecordingConfiguration;
    uid: string;
}

export const scheduleAttrs = [
    '_id',
    'cameraId',
    'groupCameraId',
    'repetitionId',
    'startAt',
    'endAt',
    'updatedAt',
    'updatedBy',
];

export const scheduleRepetitionAttrs = [
    '_id',
    'cameraId',
    'originalScheduleId',
    'initStartAt',
    'initEndAt',
    'repeatType',
    'repeatDays',
    'repeatEndDate',
    'createdBy',
    'createdAt',
    'updatedBy',
    'updatedAt',
];
