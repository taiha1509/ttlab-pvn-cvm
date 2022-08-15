export interface IFileModel {
    _id?: string;
    originalName: string;
    path: string;
    fileName: string;
    extension: string;
    mimetype: string;
    size?: number;
    createdBy?: number;
    createdAt?: Date;
    updatedBy?: number;
    updatedAt?: Date;
}
