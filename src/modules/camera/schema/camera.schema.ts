import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Schema as SchemaMongoose } from 'mongoose';
import { INPUT_TEXT_MAX_LENGTH, MongoCollections } from 'src/common/constants';
import { Resolution, Encoding } from '../camera.constant';
import {
    CameraGroup,
    CameraGroupDocument,
} from 'src/modules/camera-group/schema/cameraGroup.schema';
import { CameraRecordingConfiguration } from '../dto/type';
import { ConnectionStatus } from 'src/modules/device-controller/deviceController.constant';

export interface CameraDocument extends Camera, Document {
    cameraGroupIds?: string[] | ObjectId[];
    configurations?: string[];
}

@Schema({
    timestamps: true,
    collection: MongoCollections.CAMERAS,
})
export class Camera {
    @Prop({ length: INPUT_TEXT_MAX_LENGTH, required: true })
    name: string;

    @Prop({ length: INPUT_TEXT_MAX_LENGTH, required: true })
    password: string;

    @Prop({ length: INPUT_TEXT_MAX_LENGTH, required: true })
    serialNumber: string;

    @Prop({ length: INPUT_TEXT_MAX_LENGTH, required: true })
    uid: string;

    @Prop({ length: INPUT_TEXT_MAX_LENGTH, required: true })
    model: string;

    @Prop({ length: INPUT_TEXT_MAX_LENGTH, required: false })
    userName: string;

    @Prop({
        default: null,
        type: Array(SchemaMongoose.Types.ObjectId),
        ref: CameraGroup.name,
        unique: true,
    })
    cameraGroups: CameraGroupDocument[] | string[];

    @Prop({ required: false, type: Array, default: [], unique: false })
    userGroupIds: number[];

    @Prop({ required: false, type: Array, default: [], unique: false })
    userIds: number[];

    @Prop({
        required: true,
        type: String,
        enum: Object.values(ConnectionStatus),
        default: ConnectionStatus.ONLINE,
    })
    connectionStatus: ConnectionStatus;

    @Prop({ required: true, type: String })
    kinesisChannelARN: string;

    @Prop({ required: false, type: JSON })
    onvifProfile: Record<string, unknown>;

    @Prop({
        required: false,
        default: {
            hasAudio: true,
            gpsLocate: true,
            encoding: Encoding.NONE,
            resolution: Resolution.R_1080,
        },
        type: {
            hasAudio: Boolean,
            gpsLocate: Boolean,
            encoding: {
                type: String,
                enum: Object.values(Encoding),
            },
            resolution: {
                type: String,
                enum: Object.values(Resolution),
            },
        },
    })
    recordingConfiguration: CameraRecordingConfiguration;

    @Prop({ required: false, default: false, type: Boolean })
    hasSchedule: boolean;

    @Prop({ required: false, default: new Date(), type: Date || null })
    lastUpdateConnectionStatusAt: Date;

    @Prop({ required: false, default: null, type: Date || null })
    deletedAt: Date;

    @Prop({ required: false, default: null, type: Number })
    deletedBy: number;

    @Prop({ required: false, default: null, type: Number })
    updatedBy: number;

    @Prop({ required: true, type: Number })
    createdBy: number;
}

export const CameraSchema = SchemaFactory.createForClass(Camera);
