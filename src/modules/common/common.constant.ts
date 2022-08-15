import { CameraModel } from '../camera/camera.constant';

export const MODULE_NAME = 'common';

export enum CameraListOrderBy {
    NAME = 'name',
    SERIAL_NUMBER = 'serialNumber',
}

export const ROUTER_PREFIX_CVM = 'cvm';
export const ROUTER_PREFIX_APP = 'app';
export const ROUTER_PREFIX_DEVICE = 'device';

export enum ConfigurationAttribute {
    DO_NOT_DISTURB = 'do_not_disturb',
    DISPLAY_TIMESTAMP = 'display_timestamp',
    NIGHT_VISION = 'night_vision',
    MOTION_DETECTION = 'motion_detection',
    MOTION_ZONE = 'motion_zone',
    SOUND = 'sound',
    EMERGENCY_CALL = 'emergency_call',
    CONTROL_PAN = 'control_pan',
    CONTROL_TILT = 'control_tilt',
    CONTROL_ZOOM = 'control_zoom',
    ONVIF_CONNECTION = 'onvif_connection',
    HAS_MEMORY_CARD = 'has_memory_card',
}

export const CameraConfiguration = {
    [CameraModel.HIKVISION_MINIPTZ]: [
        ConfigurationAttribute.DO_NOT_DISTURB,
        ConfigurationAttribute.DISPLAY_TIMESTAMP,
        ConfigurationAttribute.NIGHT_VISION,
        ConfigurationAttribute.MOTION_DETECTION,
        ConfigurationAttribute.MOTION_ZONE,
        ConfigurationAttribute.SOUND,
        ConfigurationAttribute.EMERGENCY_CALL,
        ConfigurationAttribute.CONTROL_PAN,
        ConfigurationAttribute.CONTROL_TILT,
        ConfigurationAttribute.CONTROL_ZOOM,
        ConfigurationAttribute.ONVIF_CONNECTION,
        ConfigurationAttribute.HAS_MEMORY_CARD,
    ],
    [CameraModel.DS_2DE2A404IW_DE3]: [
        ConfigurationAttribute.DO_NOT_DISTURB,
        ConfigurationAttribute.DISPLAY_TIMESTAMP,
        ConfigurationAttribute.NIGHT_VISION,
        ConfigurationAttribute.MOTION_DETECTION,
        ConfigurationAttribute.MOTION_ZONE,
        ConfigurationAttribute.SOUND,
        ConfigurationAttribute.EMERGENCY_CALL,
        ConfigurationAttribute.CONTROL_PAN,
        ConfigurationAttribute.CONTROL_TILT,
        ConfigurationAttribute.CONTROL_ZOOM,
        ConfigurationAttribute.ONVIF_CONNECTION,
        ConfigurationAttribute.HAS_MEMORY_CARD,
    ],
    [CameraModel.BWC666]: [
        ConfigurationAttribute.DO_NOT_DISTURB,
        ConfigurationAttribute.DISPLAY_TIMESTAMP,
        ConfigurationAttribute.NIGHT_VISION,
        ConfigurationAttribute.MOTION_DETECTION,
        ConfigurationAttribute.MOTION_ZONE,
        ConfigurationAttribute.SOUND,
        ConfigurationAttribute.EMERGENCY_CALL,
    ],
};
