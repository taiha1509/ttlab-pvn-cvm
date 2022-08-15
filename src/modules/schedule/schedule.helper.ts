import {
    ScheduleRepeatType,
    Weekday,
    WEEKDAY_INDEX,
    weekdaysByRepeatType,
} from './schedule.constant';
import moment from 'moment';
import { convertTimeToUTC } from 'src/common/helpers/commonFunctions';
import orderBy from 'lodash/orderBy';
import { ScheduleRepetitionDocument } from './schema/scheduleRepetition.schema';
import { UpdateCameraScheduleConfigurationDto } from './dto/request/update-schedule.dto';

export function getWeekdayIndexOfSchedule(
    repeatType: ScheduleRepeatType,
    repeatDays: Weekday[],
): number[] {
    let indexes: number[] = [];
    if (repeatType === ScheduleRepeatType.CUSTOM) {
        return repeatDays.map((item) => WEEKDAY_INDEX[item]);
    }
    const weekdays = weekdaysByRepeatType[repeatType] || [];
    indexes = weekdays.map((item) => WEEKDAY_INDEX[item]);
    return orderBy(indexes);
}

/**
 * @param data options of schedule repetition.
 * @returns time of generated schedules from repetition options: {startAt, endAt}[].
 */
export function getTimeOfSchedules(data: {
    initStartAt: Date | string;
    initEndAt: Date | string;
    repeatType: ScheduleRepeatType;
    repeatEndDate: Date | string;
    repeatDays: Weekday[];
}) {
    const scheduleTime: { startAt: string | Date; endAt: string | Date }[] = [];
    const { initStartAt, initEndAt, repeatType, repeatEndDate, repeatDays } =
        data;
    const rootScheduleTime = {
        startAt: convertTimeToUTC(initStartAt),
        endAt: convertTimeToUTC(initEndAt),
    };
    scheduleTime.push(rootScheduleTime);
    const allowedWeekdayIndex = getWeekdayIndexOfSchedule(
        repeatType,
        repeatDays,
    );
    if (!allowedWeekdayIndex.length) return scheduleTime;
    for (const weekdayIndex of allowedWeekdayIndex) {
        const mmStartAt = moment(initStartAt);
        const mmEndAt = moment(initEndAt);
        do {
            mmStartAt.add(1, 'days');
            mmEndAt.add(1, 'days');
        } while (mmStartAt.weekday() !== weekdayIndex);
        if (mmStartAt.isSameOrAfter(moment(repeatEndDate))) continue;
        scheduleTime.push({
            startAt: convertTimeToUTC(mmStartAt.toDate()),
            endAt: convertTimeToUTC(mmEndAt.toDate()),
        });
        do {
            mmStartAt.add(7, 'days');
            mmEndAt.add(7, 'days');
            if (
                mmStartAt.weekday() === weekdayIndex &&
                mmStartAt.isBefore(moment(repeatEndDate))
            ) {
                scheduleTime.push({
                    startAt: convertTimeToUTC(mmStartAt.toDate()),
                    endAt: convertTimeToUTC(mmEndAt.toDate()),
                });
            }
        } while (mmStartAt.isBefore(moment(repeatEndDate)));
    }
    return orderBy(scheduleTime, ['startAt']);
}

export function checkChangingScheduleTimeInThePast(
    scheduleRepetition: ScheduleRepetitionDocument,
    body: UpdateCameraScheduleConfigurationDto,
) {
    const isValid = ['initStartAt', 'initEndAt', 'repeatEndDate'].some(
        (field) => {
            const changingData = !moment(scheduleRepetition[field]).isSame(
                moment(body[field]),
            );
            return changingData && moment(body[field]).isSameOrBefore(moment());
        },
    );
    return isValid;
}
