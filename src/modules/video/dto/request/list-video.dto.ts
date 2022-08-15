import Joi from 'src/plugins/joi';
import {
    DateFormat,
    DEFAULT_MAX_DATE,
    DEFAULT_MIN_DATE,
    OrderBy,
    OrderDirection,
} from 'src/common/constants';
import { CommonListQueryDto } from 'src/common/interfaces/common.interfaces';
import moment from 'moment';

export class VideoListQueryDto extends CommonListQueryDto<VideoOrderBy> {
    cameraIds: string[];
    startAt: Date;
    endAt: Date;
}

export enum VideoOrderBy {
    NAME = 'name',
    START_AT = 'startAt',
    END_AT = 'endAt',
    SIZE = 'size',
    DURATION = 'duration',
}

export const VideoListQuerySchema = Joi.object({
    page: Joi.number().positive(),
    limit: Joi.number().positive(),
    keyword: Joi.string().allow(''),
    cameraIds: Joi.array().items(Joi.isObjectId()).unique(),
    startAt: Joi.date()
        .greater(
            moment(DEFAULT_MIN_DATE).format(
                DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV,
            ),
        )
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV)
        .optional()
        .allow(null),
    endAt: Joi.date()
        .format(DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV)
        .greater(Joi.ref('startAt'))
        .max(
            moment(DEFAULT_MAX_DATE).format(
                DateFormat.YYYY_MM_DD_HYPHEN_HH_mm_ss_DIV,
            ),
        )
        .optional()
        .allow(null),
    orderDirection: Joi.string().valid(...Object.values(OrderDirection)),
    orderBy: Joi.string().valid(
        ...Object.values(OrderBy),
        ...Object.values(VideoOrderBy),
    ),
});
