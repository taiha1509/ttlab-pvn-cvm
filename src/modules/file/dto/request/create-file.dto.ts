import Joi from 'src/plugins/joi';
import { FilePath, MAX_SIZE_FILE } from '../../file.constants';

export class PresignedUrlQueryDto {
    path: string;
    originalName: string;
}

export const PresignedUrlQuerySchema = Joi.object({
    path: Joi.string().required(),
    originalName: Joi.string().required(),
});

export class CreateFileDto {
    path: string;
    fileName: string;
    originalName: string;
    extension: string;
    mimetype: string;
    size: number;
}

export const CreateFileSchema = Joi.object({
    path: Joi.string()
        .valid(...Object.values(FilePath))
        .required(),
    fileName: Joi.string().required(),
    originalName: Joi.string().allow(null, '').optional(),
    extension: Joi.string().allow(null, '').optional(),
    mimetype: Joi.string().allow(null, '').optional(),
    size: Joi.number()
        .strict()
        .positive()
        .max(MAX_SIZE_FILE)
        .allow(null)
        .optional(),
});
