import Joi from 'src/plugins/joi';

export const LiveViewQuerySchema = Joi.object().keys({
    cameraGroupIds: Joi.isObjectId().required(),
});

export class LiveViewQueryDto {
    cameraGroupIds: string;
}
