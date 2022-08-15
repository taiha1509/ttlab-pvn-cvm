import { SetMetadata } from '@nestjs/common';
import Joi from 'src/plugins/joi';

export enum Languages {
    EN = 'en',
    VI = 'vi',
}

export enum OrderDirection {
    ASC = 'ASC',
    DESC = 'DESC',
}

export enum OrderBy {
    ID = '_id',
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
}

export enum HttpMethods {
    POST = 'post',
    PATCH = 'patch',
    DELETE = 'delete',
}
export const DEFAULT_LANGUAGE = Languages.VI;
export const TIMEZONE_HEADER = 'x-timezone';
export const DEAULT_TIMEZONE = '+07:00';
export const TIMEZONE_NAME_HEADER = 'x-timezone-name';
export const DEFAULT_TIMEZONE_NAME = 'Asia/Bangkok';
export const ACCEPT_LANGUAGE_HEADER = 'accept-language';

export enum MongoCollections {
    CAMERAS = 'cameras',
    CAMERA_GROUPS = 'camera_groups',
    FILES = 'files',
    SCHEDULES = 'schedules',
    SCHEDULE_REPETITIONS = 'schedule_repetitions',
    VIDEOS = 'videos',
    LAYOUT_MAPS = 'layout_maps',
}

export enum UserTypes {
    SYSTEM_ADMIN = 'system_admin',
    DEVICE_ADMIN = 'device_admin',
}

export const DEFAULT_LIMIT_FOR_DROPDOWN = 1000;
export const DEFAULT_LIMIT_FOR_PAGINATION = 10;
export const DEFAULT_FIRST_PAGE = 1;
export const DEFAULT_ORDER_BY = 'createdAt';
export const DEFAULT_ORDER_DIRECTION = 'desc';

export const MIN_ID = 1;
export const MIN_PAGE_LIMIT = 1; // min item per one page
export const MIN_PAGE_VALUE = 1; // min page value
export const MAX_PAGE_LIMIT = 10000; // max item per one page
export const MAX_PAGE_VALUE = 10000; // max page value

export const BIRTHDAY_MIN_DATE = '1800-01-01';

export const INPUT_TEXT_MAX_LENGTH = 255;
export const INPUT_PHONE_MAX_LENGTH = 11;
export const INPUT_PASSWORD_MIN_LENGTH = 6;

export const TEXTAREA_MAX_LENGTH = 2000;

export const MAX_MONTH_VALUE = 12;
export const MIN_MONTH_VALUE = 1;

export const Regex = {
    URI: /^https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,}/,
    EMAIL: /([a-zA-Z0-9]+)([_.\-{1}])?([a-zA-Z0-9]+)@([a-zA-Z0-9]+)([.])([a-zA-Z.]+)/,
    PHONE: /^(\d*).{10,11}$/,
    TEXT_WITHOUT_SPECIAL_CHARACTERS: /^((?![!@#$%^&*()<>?\\/\\+|=]+).)*$/,
    PASSWORD: /^[.\S]{6,}$/,
    TEXTAREA: /^.{0,}$/,
    TEXT: /^.{0,}$/,
    NUMBER: /^(?:[0-9]\d*|)$/,
    UID: /^[a-zA-Z0-9]{1,255}$/,
};

export enum DateFormat {
    YYYY_MM_DD_HYPHEN = 'YYYY-MM-DD',
    HH_mm_ss_DIV = 'HH:mm:ss',
    YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV = 'YYYY-MM-DD HH:mm:ss',
}

export const SECONDS_IN_DAY = 86400;

export const DEFAULT_MIN_DATE = '1970-01-01 00:00:00';
export const DEFAULT_MAX_DATE = '3000-01-01 00:00:00';

export const CommonListQuerySchema = {
    page: Joi.number()
        .min(MIN_PAGE_VALUE)
        .max(MAX_PAGE_VALUE)
        .optional()
        .allow(null),
    limit: Joi.number()
        .min(MIN_PAGE_LIMIT)
        .max(MAX_PAGE_LIMIT)
        .optional()
        .allow(null),
    keyword: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
    orderDirection: Joi.string()
        .valid(...Object.values(OrderDirection))
        .optional(),
    orderBy: Joi.string()
        .valid(...Object.values(OrderBy))
        .optional(),
};

export const Permissions = (...permissions: string[]) =>
    SetMetadata('permissions', permissions);

export enum PermissionActions {
    READ = 'read',
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    INVITE = 'invite',
    CONFIG = 'config',
}

export enum PermissionResources {
    USER = 'user',
    CAMERA = 'camera',
    USER_GROUP = 'user_group',
    CAMERA_GROUP = 'camera_group',
    ROLE = 'role',
    LIVEVIEW = 'liveview',
    PLAYBACK = 'playback',
    E_MAP = 'e_map',
}

export const systemAdminResources = [
    PermissionResources.USER,
    PermissionResources.USER_GROUP,
    PermissionResources.ROLE,
];
export const deviceAdminResources = [
    PermissionResources.CAMERA,
    PermissionResources.CAMERA_GROUP,
    PermissionResources.E_MAP,
    PermissionResources.LIVEVIEW,
    PermissionResources.PLAYBACK,
];

export const uidSchema = Joi.object().keys({
    uid: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required().regex(Regex.UID),
});

export enum HttpStatus {
    OK = 200,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    INVALID_USERNAME_OR_PASSWORD = 402,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    UNPROCESSABLE_ENTITY = 422,
    GROUP_HAS_CHILDREN = 410,
    GROUP_MAX_LEVEL = 411,
    GROUP_MAX_QUANTITY = 412,
    USER_CAN_NOT_ACCESS_RESOURCE = 413,
    AWS_ERROR = 414,
    IAM_ERROR = 420,
    ITEM_NOT_FOUND = 444,
    ITEM_ALREADY_EXIST = 445,
    INTERNAL_SERVER_ERROR = 500,
    SERVICE_UNAVAILABLE = 503,
}
