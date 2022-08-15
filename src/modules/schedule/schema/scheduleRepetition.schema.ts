import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as SchemaMongoose } from 'mongoose';
import { ScheduleRepeatType, Weekday } from '../schedule.constant';
import { ScheduleDocument } from './schedule.schema';
import { CameraDocument } from '../../camera/schema/camera.schema';
import { MongoCollections } from 'src/common/constants';

export interface ScheduleRepetitionDocument
    extends ScheduleRepetition,
        Document {
    originalScheduleId?: string;
    cameraId?: string;
}

@Schema({
    timestamps: true,
    collection: MongoCollections.SCHEDULE_REPETITIONS,
})
export class ScheduleRepetition {
    @Prop({
        default: null,
        type: SchemaMongoose.Types.ObjectId,
        ref: 'Schedule',
    })
    originalSchedule: ScheduleDocument | ObjectId | string;

    @Prop({ default: null, type: SchemaMongoose.Types.ObjectId, ref: 'Camera' })
    camera: CameraDocument | ObjectId | string;

    @Prop({ required: true })
    initStartAt: Date;

    @Prop({ required: true })
    initEndAt: Date;

    @Prop({ default: true })
    recordAtServer: boolean;

    @Prop({ required: true })
    repeatEndDate: Date;

    @Prop({ type: String, required: true })
    repeatType: string | ScheduleRepeatType;

    @Prop({
        array: {
            type: String,
            enum: Object.values(Weekday),
        },
        default: [],
    })
    repeatDays: (string | Weekday)[];

    @Prop({ default: null })
    createdBy: number;

    @Prop({ default: null })
    updatedBy: number;

    @Prop({ default: null })
    deletedBy: number;

    @Prop({ default: null })
    deletedAt: Date;
}

export const ScheduleRepetitionSchema =
    SchemaFactory.createForClass(ScheduleRepetition);
