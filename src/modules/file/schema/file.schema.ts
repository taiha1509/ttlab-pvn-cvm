import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { INPUT_TEXT_MAX_LENGTH, MongoCollections } from 'src/common/constants';

export type FileDocument = File & Document;

@Schema({ timestamps: true, collection: MongoCollections.FILES })
export class File {
    @Prop({ type: String, length: INPUT_TEXT_MAX_LENGTH, default: null })
    originalName: string;

    @Prop({ type: String, required: true })
    path: string;

    @Prop({ type: String, length: INPUT_TEXT_MAX_LENGTH, required: true })
    fileName: string;

    @Prop({ type: String, length: INPUT_TEXT_MAX_LENGTH })
    extension: string;

    @Prop({ type: String, length: INPUT_TEXT_MAX_LENGTH })
    mimetype: string;

    @Prop({ type: Number })
    size: number;

    @Prop({ required: false, default: null, type: Date || null })
    deletedAt: Date;

    @Prop({ required: false, default: null, type: Number })
    deletedBy: number;

    @Prop({ required: false, default: null, type: Number })
    updatedBy: number;

    @Prop({ required: true, type: Number })
    createdBy: number;
}

export const fileSchema = SchemaFactory.createForClass(File);
