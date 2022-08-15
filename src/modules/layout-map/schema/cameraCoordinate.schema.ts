import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId, Schema as SchemaMongoose } from 'mongoose';
import {
    CameraDocument,
    Camera,
} from 'src/modules/camera/schema/camera.schema';

export interface CameraCoordinateDocument extends CameraCoordinate, Document {
    cameraId?: ObjectId | string;
    cameraGroupIds?: ObjectId | string;
}

@Schema({ _id: false })
export class CameraCoordinate {
    @Prop({
        default: null,
        type: SchemaMongoose.Types.ObjectId,
        ref: Camera.name,
    })
    camera: CameraDocument | ObjectId | string;

    @Prop({ default: null, type: Number })
    x: number;

    @Prop({ default: null, type: Number })
    y: number;
}

export const CameraCoordinateSchema =
    SchemaFactory.createForClass(CameraCoordinate);
