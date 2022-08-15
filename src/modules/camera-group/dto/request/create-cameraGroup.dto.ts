import * as Joi from 'joi';
import { ObjectId } from 'mongodb';
import { INPUT_TEXT_MAX_LENGTH } from 'src/common/constants';
import { NAME_CAMERA_GROUP_REGEX } from '../../cameraGroup.constant';

export const CreateCameraGroupSchema = Joi.object().keys({
    name: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .required()
        .trim()
        .regex(NAME_CAMERA_GROUP_REGEX)
        .label('groupCamera.field.name'),
    parentId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$|^$/)
        .allow(null)
        .allow('')
        .optional(),
});

export class CreateCameraGroupDto {
    name: string;
    createdBy: number;
    parentId: ObjectId;
    level?: number;
}
