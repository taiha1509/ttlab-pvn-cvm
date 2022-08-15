import { Connection, Model, QueryOptions } from 'mongoose';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Video, VideoDocument } from '../schema/video.schema';
import { VideoListQueryDto } from '../dto/request/list-video.dto';
import {
    DEFAULT_LIMIT_FOR_PAGINATION,
    DEFAULT_MAX_DATE,
    DEFAULT_MIN_DATE,
    MIN_PAGE_VALUE,
    OrderBy,
    OrderDirection,
} from 'src/common/constants';
import { convertTimeToUTC } from 'src/common/helpers/commonFunctions';
import { IVideoModel } from '../dto/types';
import { VideoAttrs } from '../video.constant';
import { getMongoKeywordConditions } from 'src/modules/common/helper/helper';

@Injectable()
export class VideoService {
    constructor(
        @Inject('winston') private readonly logger: Logger,
        @InjectConnection() private readonly connection: Connection,
        @InjectModel(Video.name)
        private videoModel: Model<VideoDocument>,
    ) {
        //
    }

    async getVideoList(query: VideoListQueryDto) {
        try {
            const {
                page = MIN_PAGE_VALUE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                keyword = '',
                cameraIds = [],
                startAt = DEFAULT_MIN_DATE,
                endAt = DEFAULT_MAX_DATE,
                orderDirection = OrderDirection.DESC,
                orderBy = OrderBy.CREATED_AT,
            } = query;
            const conditions = {
                createdAt: {
                    $lte: convertTimeToUTC(endAt),
                    $gte: convertTimeToUTC(startAt),
                },
                $or: getMongoKeywordConditions(['name'], keyword),
                deletedAt: null,
            };
            if (cameraIds?.length) {
                Object.assign(conditions, { cameraId: { $in: cameraIds } });
            }
            const [items, totalItems] = await Promise.all([
                this.videoModel
                    .find(conditions)
                    .collation({ locale: 'en' })
                    .sort({ [orderBy]: orderDirection })
                    .skip((+page - 1) * +limit)
                    .limit(+limit),
                this.videoModel.count(conditions),
            ]);
            return { items, totalItems };
        } catch (error) {
            this.logger.error('Error in getVideoList func', error);
            throw error;
        }
    }

    async getVideo(
        field: string,
        value: string | number,
        attrs = VideoAttrs,
        options?: QueryOptions,
    ) {
        try {
            const video = await this.videoModel.findOne(
                { [field]: value, deletedAt: null },
                attrs,
                options,
            );
            return video;
        } catch (error) {
            this.logger.error('Error in getVideo func', error);
            throw error;
        }
    }

    async createVideo(createVideo: IVideoModel) {
        try {
            const videoModel = new this.videoModel(createVideo);
            return videoModel.save();
        } catch (error) {
            this.logger.error('Error in createVideo func: ', error);
            throw error;
        }
    }

    async deleteVideo(videoId: string, deletedBy: number) {
        try {
            const deletedVideo = await this.videoModel.updateOne(
                { _id: videoId },
                { deletedAt: new Date(), deletedBy },
            );
            return deletedVideo;
        } catch (error) {
            this.logger.error('Error in deleteVideo func: ', error);
            throw error;
        }
    }
}
