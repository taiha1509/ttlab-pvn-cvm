import { CreateCameraDto } from './create-camera.dto';
import Joi from 'src/plugins/joi';
import { INPUT_TEXT_MAX_LENGTH } from 'src/common/constants';
import { Encoding, Resolution } from '../../camera.constant';
import { NAME_CAMERA_GROUP_REGEX } from 'src/modules/camera-group/cameraGroup.constant';

export const UpdateCameraSchema = Joi.object().keys({
    name: Joi.string()
        .max(INPUT_TEXT_MAX_LENGTH)
        .required()
        .trim()
        .regex(NAME_CAMERA_GROUP_REGEX)
        .label('camera.field.name'),
    cameraGroups: Joi.array()
        .items(Joi.isObjectId().optional())
        .allow(null)
        .label('camera.field.cameraGroup'),
    userGroupIds: Joi.array()
        .items(Joi.number().optional())
        .optional()
        .allow(null)
        .label('camera.field.groupUser'),
    userIds: Joi.array()
        .items(Joi.number().optional())
        .optional()
        .allow(null)
        .label('camera.field.users'),
    onvifProfile: Joi.object()
        .optional()
        .allow(null)
        .label('camera.field.onvifProfile'),
});

export class UpdateCameraDto extends CreateCameraDto {
    name: string;
    cameraGroups?: string[];
    userGroupIds: number[];
    userIds: number[];
    updatedBy: number;
    onvifProfile?: Record<string, unknown>;
}

export const CVMUpdateCameraSchema = Joi.object().keys({
    cameraIds: Joi.array().items(Joi.isObjectId().optional()).required(),
});

export class CVMUpdateCameraSchemaDto {
    cameraIds: string[];
}

export class UpdateCameraRecordingConfigurationDto {
    encoding: string;
    resolution: string;
    hasAudio: boolean;
    gpsLocate: boolean;
}

export const UpdateCameraRecordingConfigurationSchema = Joi.object().keys({
    hasAudio: Joi.boolean().required(),
    gpsLocate: Joi.boolean().required(),
    resolution: Joi.string()
        .valid(...Object.values(Resolution))
        .allow(null)
        .required(),
    encoding: Joi.string()
        .valid(...Object.values(Encoding))
        .allow(null)
        .required(),
});
