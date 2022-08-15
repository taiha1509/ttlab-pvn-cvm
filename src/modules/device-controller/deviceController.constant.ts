export const SocketEvents = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    WEB_APP_USER_LOGIN: 'web_app_user_login',
    WEB_APP_SEND_ONVIF_PROFILE: 'web_app_send_onvif_profile',
    WEB_APP_UPDATE_CAMERA_CONNECTION_STATUS:
        'web_app_update_camera_connection_status',
    DEVICE_REQUEST_ONVIF_PROFILE: 'device_request_onvif_profile',
    DEVICE_RESPONSE_ONVIF_PROFILE: 'device_response_onvif_profile',
    DEVICE_JOIN_ROOM: 'device_join_room',
    DEVICE_PTZ_CONTROL: 'device_ptz_control',
    DEVICE_SEND_SCHEDULES_CAMERA: 'device_send_schedules_camera',
    DEVICE_REQUEST_CAMERA_CONNECTION_STATUS:
        'device_request_camera_connection_status',
    DEVICE_RESPONSE_CAMERA_CONNECTION_STATUS:
        'device_response_camera_connection_status',
};

export const MODULE_NAME = 'device-controller';

export const UID_REGEX = /^[a-zA-Z0-9].{0,255}$/;

export enum PTZCommand {
    PAN = 'pan',
    TILT = 'tilt',
    ZOOM = 'zoom',
}

export enum PTZValue {
    PAN_LEFT = 'pan_left',
    PAN_RIGHT = 'pan_right',
    TILT_UP = 'tilt_up',
    TILT_DOWN = 'tilt_down',
    ZOOM_IN = 'zoom_in',
    ZOOM_OUT = 'zoom_out',
}

export const PTZValueByCommand = {
    [PTZCommand.PAN]: [PTZValue.PAN_LEFT, PTZValue.PAN_RIGHT],
    [PTZCommand.TILT]: [PTZValue.TILT_UP, PTZValue.TILT_DOWN],
    [PTZCommand.ZOOM]: [PTZValue.ZOOM_IN, PTZValue.ZOOM_OUT],
};

export enum ConnectionStatus {
    ONLINE = 'online',
    OFFLINE = 'offline',
}
