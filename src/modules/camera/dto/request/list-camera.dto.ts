import {
    CommonListQuerySchema,
    INPUT_TEXT_MAX_LENGTH,
    OrderBy,
    Regex,
} from 'src/common/constants';
import Joi from 'src/plugins/joi';
import { CameraOrderBy } from '../../camera.constant';
import { CommonListQueryDto } from 'src/common/interfaces/common.interfaces';

export const CameraListQuerySchema = Joi.object().keys({
    ...CommonListQuerySchema,
    uid: Joi.string()
        .allow(null)
        .regex(Regex.UID)
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional(),
    cameraGroupId: Joi.isObjectId(),
    orderBy: Joi.string()
        .valid(...Object.values(CameraOrderBy))
        .optional(),
});

export class CameraListQueryDto extends CommonListQueryDto<OrderBy> {
    uid?: string;
    cameraGroupId?: string;
}

export const CVMCameraListQuerySchema = Joi.object().keys({
    ids: Joi.array().items(Joi.isObjectId().allow('', null)).required(),
});

export class CVMCameraListQueryDto {
    ids: string[];
}
