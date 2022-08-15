import { INPUT_TEXT_MAX_LENGTH } from 'src/common/constants';
import Joi from 'src/plugins/joi';

export const CameraGroupListQuerySchema = Joi.object().keys({
    keyword: Joi.string().max(INPUT_TEXT_MAX_LENGTH).optional().allow(null, ''),
});

export class CameraGroupListQueryDto {
    keyword?: string;
}

export const CVMCameraGroupListQuerySchema = Joi.object().keys({
    ids: Joi.array().items(Joi.isObjectId().allow('', null)).required(),
});

export class CameraGroupListQueryCVMDto {
    ids?: string[];
}
