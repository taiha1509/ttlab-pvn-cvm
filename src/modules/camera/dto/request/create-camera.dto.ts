import Joi from 'src/plugins/joi';
import {
    INPUT_TEXT_MAX_LENGTH,
    INPUT_PASSWORD_MIN_LENGTH,
    Regex,
} from 'src/common/constants';
import { CameraModel } from '../../camera.constant';
import { NAME_CAMERA_GROUP_REGEX } from 'src/modules/camera-group/cameraGroup.constant';

export const CreateCameraSchema = Joi.object().keys({
    name: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .required()
        .trim()
        .regex(NAME_CAMERA_GROUP_REGEX)
        .label('camera.field.name'),
    password: Joi.string()
        .required()
        .trim()
        .min(INPUT_PASSWORD_MIN_LENGTH)
        .max(INPUT_TEXT_MAX_LENGTH)
        .label('camera.field.password'),
    serialNumber: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .regex(Regex.TEXT_WITHOUT_SPECIAL_CHARACTERS)
        .required()
        .label('camera.field.serialNumber'),
    model: Joi.string()
        .valid(...Object.values(CameraModel))
        .required()
        .label('camera.field.model'),
    uid: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .regex(Regex.TEXT_WITHOUT_SPECIAL_CHARACTERS)
        .required()
        .label('camera.field.uid'),
    userName: Joi.alternatives().conditional('cameraGroups', {
        not: Joi.exist(),
        then: Joi.string()
            .max(INPUT_TEXT_MAX_LENGTH)
            .required()
            .trim()
            .label('camera.field.userName'),
    }),
    cameraGroups: Joi.alternatives().conditional('onvifProfile', {
        not: Joi.exist(),
        then: Joi.array()
            .items(Joi.isObjectId().optional())
            .allow(null)
            .label('camera.field.cameraGroup'),
    }),
});

export class CreateCameraDto {
    name: string;
    password: string;
    serialNumber: string;
    model: CameraModel;
    uid: string;
    userName?: string;
    cameraGroups?: string[];
    kinesisChannelARN: string;
    createdBy: number;
}
