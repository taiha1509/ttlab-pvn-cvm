import { MAX_PAGE_LIMIT, MIN_PAGE_LIMIT } from 'src/common/constants';
import * as Joi from 'joi';

export const QueryDropdownSchema = Joi.object().keys({
    limit: Joi.number()
        .min(MIN_PAGE_LIMIT)
        .max(MAX_PAGE_LIMIT)
        .optional()
        .allow(null),
});

export class QueryDropdownDto {
    limit: number;
}
