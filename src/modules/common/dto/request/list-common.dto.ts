import { CommonListQuerySchema, OrderBy } from 'src/common/constants';
import { CommonListQueryDto } from 'src/common/interfaces/common.interfaces';
import Joi from 'src/plugins/joi';
import { CameraListOrderBy } from '../../common.constant';
export class CommonCameraListQueryDto extends CommonListQueryDto<CameraListOrderBy> {
    //
}

export const CommonCameraListQuerySchema = Joi.object().keys({
    ...CommonListQuerySchema,
    orderBy: Joi.string()
        .valid(...Object.values(OrderBy), ...Object.values(CameraListOrderBy))
        .optional(),
});
