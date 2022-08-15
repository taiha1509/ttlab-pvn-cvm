import { ObjectId } from 'mongoose';
import { Camera } from 'src/modules/camera/schema/camera.schema';
import { Schedule } from 'src/modules/schedule/schema/schedule.schema';

export interface IVideoModel {
    cameraId: ObjectId | string;
    camera?: Camera;
    scheduleId?: ObjectId | string;
    schedule?: Schedule;
    name: string;
    src: string;
    startAt?: Date;
    endAt?: Date;
    duration?: number; // seconds
    status?: string;
    format?: string;
    size?: number; // KB
    encoding?: string;
    createdBy: number | null;
    createdAt?: Date;
    updatedBy?: number | null;
    updatedAt?: Date;
    deletedBy?: number | null;
    deletedAt?: Date;
}
