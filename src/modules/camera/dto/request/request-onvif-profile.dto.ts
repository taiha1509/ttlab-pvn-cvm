import JoiBase from 'joi';
import JoiDate from '@joi/date';
import { INPUT_TEXT_MAX_LENGTH, Regex } from 'src/common/constants';

const Joi = JoiBase.extend(JoiDate);

export const OnvifRequestSchema = Joi.object().keys({
    username: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .required()
        .label('camera.field.username'),
    password: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .required()
        .label('camera.field.password'),
    uid: Joi.string().regex(Regex.UID).required().label('camera.field.uid'),
    clientSocketRoom: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .required()
        .label('camera.field.clientSocketRoom'),
});

export class OnvifRequestDto {
    username: string;
    password: string;
    uid: string;
    clientSocketRoom: string;
}
