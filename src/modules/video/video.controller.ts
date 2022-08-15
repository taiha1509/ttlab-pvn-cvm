import {
    Controller,
    Get,
    InternalServerErrorException,
    UseGuards,
    Query,
    Body,
    Post,
    Req,
    Delete,
    Param,
} from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { JoiValidationPipe } from 'src/common/pipes/joi.validation.pipe';
import {
    VideoListQueryDto,
    VideoListQuerySchema,
} from './dto/request/list-video.dto';
import { VideoService } from './service/video.service';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import {
    CreateVideoDto,
    CreateVideoSchema,
} from './dto/request/create.video.dto';
import { convertTimeToUTC } from 'src/common/helpers/commonFunctions';
import { CameraMongoService } from '../camera/service/cameraMongo.service';
import Joi from '../../plugins/joi';
import { ROUTER_PREFIX_APP } from '../common/common.constant';
import { HttpStatus } from 'src/common/constants';
import { RemoveEmptyQueryPipe } from 'src/common/pipes/remove.empty.query.pipe';
import { TrimBodyData } from 'src/common/pipes/trim.body.data.pipe';
import { RoleGuard } from 'src/common/guards/role.guard';
import {
    PermissionActions,
    PermissionResources,
    Permissions,
} from 'src/common/constants';

@Controller(`/${ROUTER_PREFIX_APP}/video`)
@UseGuards(JwtGuard, RoleGuard)
export class VideoController {
    constructor(
        private readonly videoService: VideoService,
        private readonly cameraService: CameraMongoService,
        private readonly i18n: I18nRequestScopeService,
    ) {
        // eslint-disable-next-line prettier/prettier
    }

    @Delete(':id')
    @Permissions(`${PermissionResources.PLAYBACK}_${PermissionActions.DELETE}`)
    async deleteVideo(
        @Req() req,
        @Param('id', new JoiValidationPipe(Joi.isObjectId())) videoId: string,
    ) {
        try {
            const { loginUser = {} } = req;
            const video = await this.videoService.getVideo('_id', videoId, [
                '_id',
            ]);
            if (!video) {
                const message = await this.i18n.translate(
                    'video.error.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            await this.videoService.deleteVideo(videoId, loginUser.id);
            return new SuccessResponse({ _id: videoId });
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get()
    @Permissions(`${PermissionResources.PLAYBACK}_${PermissionActions.READ}`)
    async getVideoList(
        @Query(
            new JoiValidationPipe(VideoListQuerySchema),
            new RemoveEmptyQueryPipe(),
        )
        query: VideoListQueryDto,
    ) {
        try {
            const data = await this.videoService.getVideoList(query);
            return new SuccessResponse(data);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Get(':id')
    @Permissions(`${PermissionResources.PLAYBACK}_${PermissionActions.READ}`)
    async getVideoDetail(
        @Param('id', new JoiValidationPipe(Joi.isObjectId())) videoId: string,
    ) {
        try {
            const video = await this.videoService.getVideo('_id', videoId);
            if (!video) {
                const message = await this.i18n.translate(
                    'video.error.notExist',
                );
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    message,
                    [],
                );
            }
            return new SuccessResponse(video);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post()
    @Permissions(`${PermissionResources.PLAYBACK}_${PermissionActions.CREATE}`)
    async createVideo(
        @Req() req,
        @Body(new JoiValidationPipe(CreateVideoSchema), new TrimBodyData())
        body: CreateVideoDto,
    ) {
        try {
            const { loginUser = {} } = req;
            if (body.cameraId) {
                const camera = await this.cameraService.getCameraById(
                    body.cameraId,
                );
                if (!camera) {
                    const message = await this.i18n.translate(
                        'camera.get.wrong.id',
                    );
                    return new ErrorResponse(HttpStatus.BAD_REQUEST, message, [
                        {
                            key: 'cameraId',
                            errorCode: HttpStatus.ITEM_NOT_FOUND,
                            message,
                        },
                    ]);
                }
            }
            const video = await this.videoService.createVideo({
                ...body,
                startAt: body.startAt ? convertTimeToUTC(body.startAt) : null,
                endAt: body.endAt ? convertTimeToUTC(body.endAt) : null,
                createdBy: loginUser.id,
            });
            return new SuccessResponse(video);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
