import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export interface LayoutMapFileDocument extends LayoutMapFile, Document {
    url?: string;
}

@Schema({ _id: false })
export class LayoutMapFile {
    @Prop({ required: false, default: null, type: String })
    fileName: string;

    @Prop({ required: false, default: null, type: String })
    originalName: string;

    @Prop({ required: false, default: null, type: String })
    extension: string;

    @Prop({ required: false, default: null, type: String })
    mimetype: string;

    @Prop({ required: false, default: null, type: Number })
    size: string;
}

export const layoutMapFileSchema = SchemaFactory.createForClass(LayoutMapFile);
