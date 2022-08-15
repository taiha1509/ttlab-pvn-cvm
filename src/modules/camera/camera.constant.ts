export const MODULE_NAME = 'camera';
export const MAX_CAMERAS_IN_GROUP = 16;

// Manufacturer_CameraModel
export enum CameraModel {
    HIKVISION_MINIPTZ = 'hikvision_miniptz',
    BWC666 = 'BWC-666',
    DS_2DE2A404IW_DE3 = 'DS-2DE2A404IW-DE3',
}

export const UID = 'uid';

export const SERIAL_NUMBER = 'serialNumber';

export const USERNAME = 'userName';

export enum Resolution {
    R_1080 = '1080p',
    R_720 = '720p',
    R_480 = '480p',
}

export enum Encoding {
    NONE = 'none',
    AES_256 = 'aes_256',
    AES_128 = 'aes_128',
}

export enum AWSException {
    RESOURCEINUSE = 'ResourceInUseException',
}

export enum CameraOrderBy {
    ID = '_id',
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
    NAME = 'name',
}

// 5 minites
export const PERIOD_TIME_UPDATING_CAMERA_CONNECTION_STATUS = 300000;
