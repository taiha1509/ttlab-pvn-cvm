import * as Joi from 'joi';
import ConfigKey from './config-key';

export default Joi.object({
    [ConfigKey.PORT]: Joi.number().default(3000),
    [ConfigKey.VERSION]: Joi.string().required(),
    [ConfigKey.MONGO_DATABSE_CONNECTION_STRING]: Joi.string().required(),
    [ConfigKey.CORS_WHITELIST]: Joi.string().required(),
    [ConfigKey.TOKEN_PUBLIC_KEY]: Joi.string().required(),
    [ConfigKey.LOG_LEVEL]: Joi.string()
        .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
        .required(),
    [ConfigKey.TOKEN_PUBLIC_KEY_EXPIRED_IN]: Joi.string().required(),
    [ConfigKey.AWS_ACCESS_KEY_ID]: Joi.string().required(),
    [ConfigKey.AWS_SECRET_ACCESS_KEY]: Joi.string().required(),
    [ConfigKey.AWS_REGION]: Joi.string().required(),
    [ConfigKey.AWS_S3_BUCKET]: Joi.string().required(),
    [ConfigKey.AWS_S3_DOMAIN]: Joi.string().required(),
    [ConfigKey.IAM_API_URL]: Joi.string().required(),
    [ConfigKey.AUTH0_DOMAIN]: Joi.string().required(),
    [ConfigKey.AUTH0_AUDIENCE]: Joi.string().required(),
    [ConfigKey.AUTH0_CVM_IAM_CLIENT_ID]: Joi.string().required(),
    [ConfigKey.AUTH0_CVM_IAM_CLIENT_SECRET]: Joi.string().required(),
    [ConfigKey.HTTP_TIMEOUT]: Joi.number().default(5000),
    [ConfigKey.HTTP_MAX_REDIRECTS]: Joi.number().default(5),
    [ConfigKey.CRON_JOB_UPDATE_CAMERA_CONNECTION_STATUS]:
        Joi.string().required(),
    [ConfigKey.CRON_JOB_SEND_SCHEDULES_TO_CAMERA]: Joi.string().required(),
    [ConfigKey.MAX_SCHEDULES_IN_FUTURE_DAYS]: Joi.number().required(),
});
