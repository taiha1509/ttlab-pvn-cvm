import moment from 'moment';
import {
    DateFormat,
    DEFAULT_MAX_DATE,
    DEFAULT_MIN_DATE,
    INPUT_TEXT_MAX_LENGTH,
} from 'src/common/constants';
import Joi from 'src/plugins/joi';
import { VideoFormat, VideoStatus } from '../../video.constant';

export class CreateVideoDto {
    cameraId: string;
    name: string;
    src: string;
    startAt: Date;
    endAt: Date;
    duration: number; // seconds
    status: VideoStatus;
    format: string;
    size: number; // KB
    encoding?: string;
}

export const CreateVideoSchema = Joi.object().keys({
    cameraId: Joi.isObjectId().allow(null).required(),
    name: Joi.string().max(INPUT_TEXT_MAX_LENGTH).required(),
    src: Joi.string().required(),
    startAt: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV)
        .allow(null)
        .min(
            moment(DEFAULT_MIN_DATE).format(
                DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV,
            ),
        )
        .max(
            moment(DEFAULT_MAX_DATE).format(
                DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV,
            ),
        )
        .required(),
    endAt: Joi.when('startAt', {
        is: Joi.valid(null),
        then: Joi.valid(null),
        otherwise: Joi.date()
            .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV)
            .greater(Joi.ref('startAt'))
            .max(
                moment(DEFAULT_MAX_DATE).format(
                    DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV,
                ),
            )
            .required(),
    }),
    duration: Joi.number().strict().positive().required(), // seconds
    status: Joi.string().valid(...Object.values(VideoStatus)),
    format: Joi.string()
        .valid(...Object.values(VideoFormat))
        .required(),
    size: Joi.number().strict().positive().required(), // KB
    encoding: Joi.string().length(INPUT_TEXT_MAX_LENGTH).allow(null),
});
