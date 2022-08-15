import { INPUT_TEXT_MAX_LENGTH, Regex } from 'src/common/constants';
import { CameraDocument } from 'src/modules/camera/schema/camera.schema';
import Joi from 'src/plugins/joi';
import { CAMERA_COORDINATE_RANGE } from '../../layoutMap.constant';
import { CreateLayoutMapFileSchema } from './create-layout-map.dto';

export class UpdateLayoutMapDto {
    name: string;
    cameraCoordinates: CameraCoordinateDto[];
    updatedBy: number;
}

export class CameraCoordinateDto {
    cameraId?: string;
    camera?: string | CameraDocument;
    x: number;
    y: number;
}

const cameraCoordinateSchema = Joi.object().keys({
    cameraId: Joi.isObjectId().required(),
    x: Joi.number()
        .strict()
        .min(CAMERA_COORDINATE_RANGE.MIN)
        .max(CAMERA_COORDINATE_RANGE.MAX)
        .required(),
    y: Joi.number()
        .strict()
        .min(CAMERA_COORDINATE_RANGE.MIN)
        .max(CAMERA_COORDINATE_RANGE.MAX)
        .required(),
});

export const updateLayoutMapSchema = Joi.object().keys({
    name: Joi.string()
        .regex(Regex.TEXT_WITHOUT_SPECIAL_CHARACTERS)
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional(),
    cameraCoordinates: Joi.array().items(cameraCoordinateSchema).required(),
    file: CreateLayoutMapFileSchema,
});
