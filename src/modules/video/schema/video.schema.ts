import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as SchemaMongoose } from 'mongoose';
import { MongoCollections } from 'src/common/constants';
import { Schedule } from 'src/modules/schedule/schema/schedule.schema';
import { Camera } from '../../camera/schema/camera.schema';
import { VideoFormat, VideoStatus } from '../video.constant';

export type VideoDocument = Video & Document;

@Schema({
    timestamps: true,
    collection: MongoCollections.VIDEOS,
})
export class Video {
    @Prop({ default: null, type: SchemaMongoose.Types.ObjectId, ref: 'Camera' })
    cameraId: ObjectId | Camera;

    @Prop({
        default: null,
        type: SchemaMongoose.Types.ObjectId,
        ref: 'Schedule',
    })
    scheduleId: ObjectId | Schedule;

    @Prop({ default: null, type: String })
    name: string;

    @Prop({ default: null, type: String })
    src: string;

    @Prop({ default: null, type: Date })
    startAt: Date;

    @Prop({ default: null, type: Date })
    endAt: Date;

    @Prop({ default: null, type: Number })
    duration: number; // seconds

    @Prop({ default: null, type: String, enum: Object.values(VideoStatus) })
    status: string;

    @Prop({ default: null, type: String, enum: Object.values(VideoFormat) })
    format: string;

    @Prop({ default: null, type: Number })
    size: number; // KB

    @Prop({ default: null, type: String })
    encoding: string;

    @Prop({ default: null })
    createdBy: number;

    @Prop({ default: null })
    updatedBy: number;

    @Prop({ default: null })
    deletedBy: number;

    @Prop({ default: null })
    deletedAt: Date;
}

export const VideoSchema = SchemaFactory.createForClass(Video);
