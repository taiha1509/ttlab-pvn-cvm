import {
    Controller,
    Get,
    InternalServerErrorException,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { SuccessResponse } from 'src/common/helpers/response';
import { JoiValidationPipe } from 'src/common/pipes/joi.validation.pipe';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { CameraGroupDetailDropdownResponseDto } from '../camera-group/dto/response/list-cameraGroup.dto';
import {
    CameraConfiguration,
    MODULE_NAME,
    ROUTER_PREFIX_APP,
} from './common.constant';
import {
    QueryDropdownDto,
    QueryDropdownSchema,
} from './dto/request/list-dropdown.dto';
import {
    CommonCameraListQueryDto,
    CommonCameraListQuerySchema,
} from './dto/request/list-common.dto';
import { CommonDropdownService } from './service/common-dropdown.service';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';
import { CameraModel } from '../camera/camera.constant';
import { JwtGuard } from 'src/common/guards/jwt.guard';

@Controller(`/${ROUTER_PREFIX_APP}/common`)
@UseGuards(JwtGuard)
export class CommonController {
    constructor(
        private readonly commonDropdownService: CommonDropdownService,
        private readonly i18n: I18nRequestScopeService,
        private readonly configService: ConfigService,
    ) {
        //
    }

    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    @Get('/camera-group')
    async getListCameraGroup(
        @Query(new JoiValidationPipe(QueryDropdownSchema))
        query: QueryDropdownDto,
    ) {
        try {
            const data: CameraGroupDetailDropdownResponseDto[] =
                await this.commonDropdownService.getCameraGroupList(query);
            return new SuccessResponse(data);
        } catch (error) {
            return new InternalServerErrorException(error);
        }
    }

    @Get('/camera')
    async getCameraList(
        @Req() req,
        @Query(
            new JoiValidationPipe(CommonCameraListQuerySchema),
            new RemoveEmptyQueryPipe(),
        )
        query: CommonCameraListQueryDto,
    ) {
        try {
            const loginUser = req.loginUser;
            const cameraList = await this.commonDropdownService.getCameraList(
                query,
                loginUser,
            );
            return new SuccessResponse(cameraList);
        } catch (error) {
            return new InternalServerErrorException(error);
        }
    }

    @Get('camera-model')
    async getCameraModels() {
        try {
            const data = Object.values(CameraModel).map((model) => ({
                name: model,
                configurations: CameraConfiguration[model],
            }));
            return new SuccessResponse(data);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
