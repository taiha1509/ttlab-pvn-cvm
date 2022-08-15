import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { INPUT_TEXT_MAX_LENGTH, MongoCollections } from 'src/common/constants';
import { ObjectId } from 'mongodb';
import {
    LayoutMapFileDocument,
    layoutMapFileSchema,
} from './layoutMapFile.schema';
import {
    CameraCoordinateDocument,
    CameraCoordinateSchema,
} from './cameraCoordinate.schema';
import { Schema as SchemaMongoose } from 'mongoose';
import {
    CameraGroup,
    CameraGroupDocument,
} from 'src/modules/camera-group/schema/cameraGroup.schema';

export interface LayoutMapDocument extends LayoutMap, Document {
    cameraGroupId?: ObjectId | string;
}

@Schema({
    timestamps: true,
    collection: MongoCollections.LAYOUT_MAPS,
})
export class LayoutMap {
    @Prop({
        required: true,
        type: SchemaMongoose.Types.ObjectId,
        ref: CameraGroup.name,
    })
    cameraGroup: CameraGroupDocument | ObjectId | string;

    @Prop({
        required: true,
        type: String,
        maxLength: INPUT_TEXT_MAX_LENGTH,
        trim: true,
    })
    name: string;

    @Prop({
        required: false,
        default: {},
        type: layoutMapFileSchema,
    })
    file: LayoutMapFileDocument;

    @Prop({ required: false, default: [], type: [CameraCoordinateSchema] })
    cameraCoordinates: CameraCoordinateDocument[];

    @Prop({ required: false, default: null, type: Date })
    deletedAt: Date;

    @Prop({ required: false, default: null, type: Number })
    deletedBy: number;

    @Prop({ required: false, default: null, type: Number })
    updatedBy: number;

    @Prop({ required: true, type: Number })
    createdBy: number;
}

export const LayoutMapSchema = SchemaFactory.createForClass(LayoutMap);
