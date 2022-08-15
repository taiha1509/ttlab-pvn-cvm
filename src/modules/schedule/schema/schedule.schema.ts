import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as SchemaMongoose } from 'mongoose';
import { ScheduleTarget } from '../schedule.constant';
import { CameraDocument } from '../../camera/schema/camera.schema';
import { ScheduleRepetition } from './scheduleRepetition.schema';
import { MongoCollections } from 'src/common/constants';

export interface ScheduleDocument extends Schedule, Document {
    cameraId?: string;
    scheduleRepetitionId?: string;
}

@Schema({
    timestamps: true,
    collection: MongoCollections.SCHEDULES,
})
export class Schedule {
    @Prop({ default: null, type: SchemaMongoose.Types.ObjectId, ref: 'Camera' })
    camera: CameraDocument | ObjectId | string;

    @Prop({
        default: null,
        type: SchemaMongoose.Types.ObjectId,
        ref: 'ScheduleRepetition',
    })
    scheduleRepetition: ScheduleRepetition | string;

    // specific this schedule's used for an one camera or a Camera group.
    @Prop({ default: null, enum: Object.values(ScheduleTarget) })
    target: string;

    @Prop({ default: null, required: true })
    startAt: Date;

    @Prop({ required: true })
    endAt: Date;

    @Prop({ default: null })
    createdBy: number;

    @Prop({ default: null })
    updatedBy: number;

    @Prop({ default: null })
    deletedBy: number;

    @Prop({ default: null })
    deletedAt: Date;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
