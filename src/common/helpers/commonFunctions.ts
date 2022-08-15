import momentTimezone from 'moment-timezone';
import { DateFormat, DEFAULT_TIMEZONE_NAME } from '../constants';

// function to return number of skip item in database
export function getTotalSkipItem(page: number, limit: number) {
    return page > 0 ? (page - 1) * limit : 0;
}

export function extractToken(authorization = '') {
    if (/^Bearer /.test(authorization)) {
        return authorization.substr(7, authorization.length);
    }
    return '';
}

export function convertTimeToUTC(time: string | Date) {
    return momentTimezone.tz(time, 'UTC').toDate();
}

export function isStartOfDay(
    dateTime: string | Date,
    tzName = DEFAULT_TIMEZONE_NAME,
) {
    const time = momentTimezone
        .tz(convertTimeToUTC(dateTime), tzName)
        .format(DateFormat.HH_mm_ss_DIV);
    return /00:00:00/.test(time);
}
export function isEndOfDay(
    dateTime: string | Date,
    tzName = DEFAULT_TIMEZONE_NAME,
) {
    const time = momentTimezone
        .tz(convertTimeToUTC(dateTime), tzName)
        .format(DateFormat.HH_mm_ss_DIV);
    return /11:59:59/.test(time);
}
