export const MODULE_NAME = 'video';

export enum VideoFormat {
    MP4 = 'mp4',
}

export enum VideoStatus {
    IN_PROGRESS = 'in_progress',
    DONE = 'done',
}

export const VideoAttrs = [
    'cameraId',
    'scheduleId',
    'name',
    'src',
    'startAt',
    'endAt',
    'duration', // seconds
    'status',
    'format',
    'size', // KB
    'encoding',
    'createdBy',
    'createdAt',
    'updatedBy',
    'updatedAt',
    'deletedBy',
    'deletedAt',
];
