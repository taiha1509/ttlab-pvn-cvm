import {
    Controller,
    Get,
    InternalServerErrorException,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { SuccessResponse } from 'src/common/helpers/response';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { JoiValidationPipe } from 'src/common/pipes/joi.validation.pipe';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';
import { ROUTER_PREFIX_APP } from '../common/common.constant';
import {
    LiveViewQueryDto,
    LiveViewQuerySchema,
} from './dto/request/list-live-view';
import { LiveViewCameraService } from './services/liveviewMongo.service';
import { RoleGuard } from 'src/common/guards/role.guard';
import {
    PermissionActions,
    PermissionResources,
    Permissions,
    UserTypes,
} from 'src/common/constants';

@UseGuards(JwtGuard, RoleGuard)
@Controller(`/${ROUTER_PREFIX_APP}/live-view`)
export class LiveViewControler {
    constructor(
        private readonly liveViewCameraService: LiveViewCameraService,
    ) {}
    @Get('')
    @Permissions(`${PermissionResources.LIVEVIEW}_${PermissionActions.READ}`)
    async getCameraList(
        @Req() req,
        @Query(
            new JoiValidationPipe(LiveViewQuerySchema),
            new RemoveEmptyQueryPipe(),
        )
        query: LiveViewQueryDto,
    ) {
        try {
            const loginUser = req.loginUser;
            if (
                !(loginUser?.types as UserTypes[])?.includes(
                    UserTypes.DEVICE_ADMIN,
                )
            ) {
                const cameraList =
                    await this.liveViewCameraService.getLivewViewInfoUser(
                        query,
                        loginUser,
                    );
                return new SuccessResponse(cameraList);
            }
            const cameraList =
                await this.liveViewCameraService.getLiveViewInfoDeviceAdmin(
                    query,
                );
            return new SuccessResponse(cameraList);
        } catch (error) {
            throw new InternalServerErrorException();
        }
    }
}
