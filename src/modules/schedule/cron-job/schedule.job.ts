import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { DEFAULT_TIMEZONE_NAME } from 'src/common/constants';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { CameraMongoService } from 'src/modules/camera/service/cameraMongo.service';
import { SchedulesGateway } from 'src/modules/device-controller/sockets/schedules.gateway';
import { MODULE_NAME } from '../schedule.constant';
import { ScheduleService } from '../service/schedule.service';
import * as dotenv from 'dotenv';

dotenv.config();
const { CRON_JOB_SEND_SCHEDULES_TO_CAMERA } = process.env;

@Injectable()
export class ScheduleJob {
    constructor(
        private readonly configService: ConfigService,
        private readonly cameraService: CameraMongoService,
        private readonly scheduleService: ScheduleService,
        private readonly scheduleGateway: SchedulesGateway,
    ) {
        // eslint-disable-next-line prettier/prettier
    }
    private readonly logger = createWinstonLogger(
        `${MODULE_NAME}-schedule-job`,
        this.configService,
    );

    @Cron(CRON_JOB_SEND_SCHEDULES_TO_CAMERA, {
        timeZone: DEFAULT_TIMEZONE_NAME,
    })
    async sendSchedulesToCamera() {
        try {
            this.logger.info(
                'Start sendSchedulesToCamera job at: ',
                new Date(),
            );
            const cameras =
                await this.cameraService.getCameraForScheduleUpdateByIds();
            cameras.forEach(async (camera) => {
                const scheduleInformation =
                    await this.scheduleService.getSchedulesDataWithRecordingConfiguration(
                        camera,
                    );
                this.scheduleGateway.sendSchedules(
                    camera.uid,
                    scheduleInformation,
                );
            });
            this.logger.info('Stop sendSchedulesToCamera job at: ', new Date());
        } catch (error) {
            this.logger.error('Error in handleCron func: ', error);
        }
    }
}
