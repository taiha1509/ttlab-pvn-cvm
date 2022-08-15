import { INPUT_TEXT_MAX_LENGTH, Regex } from 'src/common/constants';
import { CameraGroup } from 'src/modules/camera-group/schema/cameraGroup.schema';
import Joi from 'src/plugins/joi';

export class CreateLayoutMapDto {
    cameraGroupId?: string;
    cameraGroup: string | CameraGroup;
    name: string;
    file: CreateLayoutMapFileDto;
    createdBy: number;
}

class CreateLayoutMapFileDto {
    originalName: string;
    fileName: string;
    extension: string;
    mimetype: string;
    size: number;
}

export const CreateLayoutMapFileSchema = {
    originalName: Joi.string().required(),
    fileName: Joi.string().required(),
    extension: Joi.string().allow(null, '').optional(),
    mimetype: Joi.string().allow(null, '').optional(),
    size: Joi.number().strict().positive().allow(null).optional(),
};

export const createLayoutMapSchema = Joi.object().keys({
    cameraGroupId: Joi.isObjectId().required(),
    name: Joi.string()
        .regex(Regex.TEXT_WITHOUT_SPECIAL_CHARACTERS)
        .max(INPUT_TEXT_MAX_LENGTH)
        .required(),
    file: CreateLayoutMapFileSchema,
});
