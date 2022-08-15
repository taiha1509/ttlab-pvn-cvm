import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Camera } from '../../camera/schema/camera.schema';
import { CameraDocument } from 'src/modules/camera/schema/camera.schema';
import { CameraDetail } from '../dto/response/detail.dto';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { MODULE_NAME } from '../deviceController.constant';

const deviceControllerAttributes = ['_id', 'uid', 'kinesisChannelARN'];
@Injectable()
export class DeviceControllerService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Camera.name) private cameraModel: Model<CameraDocument>,
    ) {}

    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    async getCameraDetailByUid(
        uid: string,
        attrs = deviceControllerAttributes,
    ): Promise<CameraDetail> {
        try {
            const cameraInfo = await this.cameraModel.findOne(
                {
                    $and: [
                        {
                            uid: uid,
                            deletedAt: { $exists: true, $eq: null },
                        },
                    ],
                },
                attrs,
            );
            return cameraInfo;
        } catch (error) {
            this.logger.error(
                `Error in ${DeviceControllerService.name} - getCameraDetailByUid func: `,
                error,
            );
            throw error;
        }
    }

    async getCameraDetailById(
        _id: string,
        attrs = deviceControllerAttributes,
    ): Promise<CameraDetail> {
        try {
            const cameraDetail = await this.cameraModel.findOne(
                {
                    _id,
                    deletedAt: { $exists: true, $eq: null },
                },
                attrs,
            );
            return cameraDetail;
        } catch (error) {
            this.logger.error(
                `Error in ${DeviceControllerService.name} - getCameraDetailById func: `,
                error,
            );
            throw error;
        }
    }
}
