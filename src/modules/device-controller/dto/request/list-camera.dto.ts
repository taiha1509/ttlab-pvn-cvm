import { INPUT_TEXT_MAX_LENGTH } from 'src/common/constants';
import * as Joi from 'joi';
import { UID_REGEX } from 'src/modules/device-controller/deviceController.constant';

export const CameraQuerySchema = Joi.object().keys({
    uid: Joi.string()
        .allow(null)
        .regex(UID_REGEX)
        .max(INPUT_TEXT_MAX_LENGTH)
        .optional(),
});

export class CameraListQueryDto {
    uid?: string;
}
