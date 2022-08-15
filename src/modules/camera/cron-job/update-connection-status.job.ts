import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import ConfigKey from 'src/common/config/config-key';
import { DEFAULT_TIMEZONE_NAME } from 'src/common/constants';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { ConnectionStatus } from 'src/modules/device-controller/deviceController.constant';
import {
    MODULE_NAME,
    PERIOD_TIME_UPDATING_CAMERA_CONNECTION_STATUS,
} from '../camera.constant';
import { Camera, CameraDocument } from '../schema/camera.schema';
import * as dotenv from 'dotenv';

dotenv.config();

const scheduleAt =
    process.env[ConfigKey.CRON_JOB_UPDATE_CAMERA_CONNECTION_STATUS];
const BUFFER_TIME = 60000;

@Injectable()
export class UpdateConnectionStatusCronJob {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Camera.name) private cameraModel: Model<CameraDocument>,
    ) {}

    private logger = createWinstonLogger(
        `${MODULE_NAME}-cron-job`,
        this.configService,
    );

    async updateStatus() {
        const now = new Date();
        await this.cameraModel.updateMany(
            {
                lastUpdateConnectionStatusAt: {
                    $lte: new Date(
                        now.getTime() -
                            PERIOD_TIME_UPDATING_CAMERA_CONNECTION_STATUS -
                            BUFFER_TIME,
                    ),
                },
            },
            {
                connectionStatus: ConnectionStatus.OFFLINE,
                lastUpdateConnectionStatusAt: now,
            },
        );
    }

    @Cron(scheduleAt, {
        timeZone: DEFAULT_TIMEZONE_NAME,
    })
    async handleCronJob() {
        try {
            this.logger.info(
                `Start running job to update camera connection status at: ${new Date()}`,
            );
            await this.updateStatus();
            this.logger.info(
                `Finish job update camera connection status at ${new Date()}`,
            );
        } catch (error) {
            this.logger.error('Update connection status cron job error', error);
        }
    }
}
