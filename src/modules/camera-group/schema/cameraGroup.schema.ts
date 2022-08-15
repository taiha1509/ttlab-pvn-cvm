import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { INPUT_TEXT_MAX_LENGTH, MongoCollections } from 'src/common/constants';
import { ObjectId } from 'mongodb';

export interface CameraGroupDocument extends CameraGroup, Document {
    _id: ObjectId | string;
}
@Schema({
    timestamps: true,
    collection: MongoCollections.CAMERA_GROUPS,
})
export class CameraGroup {
    @Prop({ length: INPUT_TEXT_MAX_LENGTH, required: true, type: String })
    name: string;

    @Prop({ length: INPUT_TEXT_MAX_LENGTH, required: false, type: ObjectId })
    parentId: ObjectId;

    @Prop({ required: true, type: Number })
    level: number;

    @Prop({ required: false, default: [], type: Array })
    userIds: number[];

    @Prop({ required: false, default: null, type: Date || null })
    deletedAt: Date;

    @Prop({ required: false, default: null, type: Number })
    deletedBy: number;

    @Prop({ required: false, default: null, type: Number })
    updatedBy: number;

    @Prop({ required: true, type: Number })
    createdBy: number;
}

export const CameraGroupSchema = SchemaFactory.createForClass(CameraGroup);
