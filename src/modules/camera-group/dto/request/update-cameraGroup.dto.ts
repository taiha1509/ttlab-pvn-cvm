import Joi from 'src/plugins/joi';
import { INPUT_TEXT_MAX_LENGTH } from 'src/common/constants';
import { NAME_CAMERA_GROUP_REGEX } from '../../cameraGroup.constant';

export const UpdateCameraGroupSchema = Joi.object().keys({
    name: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .required()
        .trim()
        .regex(NAME_CAMERA_GROUP_REGEX)
        .label('camera.field.name'),
});

export class UpdateCameraGroupDto {
    name: string;
    updatedBy: number;
}

export const CVMUpdateCameraGroupSchema = Joi.object().keys({
    cameraGroupIds: Joi.array().items(Joi.isObjectId().optional()).required(),
});

export class CVMUpdateCameraGroupSchemaDto {
    cameraGroupIds: string[];
}
