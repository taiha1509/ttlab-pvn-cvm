import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Camera, CameraDocument } from '../schema/camera.schema';
import { CreateCameraDto } from '../dto/request/create-camera.dto';
import * as AWS from 'aws-sdk';
import { generateKinesisChannelName } from '../helpers/commonFunctions';
import ConfigKey from 'src/common/config/config-key';
import { AWSException } from '../camera.constant';

@Injectable()
export class CameraKinesisService {
    constructor(
        @InjectModel(Camera.name) private cameraModel: Model<CameraDocument>,
    ) {}

    async createSignalingChannel(
        createCameraDto: CreateCameraDto,
    ): Promise<string> {
        const kinesisVideo = new AWS.KinesisVideo({
            region: process.env[ConfigKey.AWS_REGION],
            accessKeyId: process.env[ConfigKey.AWS_ACCESS_KEY_ID],
            secretAccessKey: process.env[ConfigKey.AWS_SECRET_ACCESS_KEY],
            endpoint: null,
            sessionToken: null,
        });
        let channelARN = '';
        await kinesisVideo
            .createSignalingChannel({
                ChannelName: generateKinesisChannelName(createCameraDto),
            })
            .promise()
            .then((res) => {
                channelARN = res?.ChannelARN;
            })
            .catch(async (error) => {
                if (error.code === AWSException.RESOURCEINUSE) {
                    const res = await kinesisVideo
                        .listSignalingChannels({
                            ChannelNameCondition: {
                                ComparisonOperator: 'BEGINS_WITH',
                                ComparisonValue:
                                    generateKinesisChannelName(createCameraDto),
                            },
                        })
                        .promise();
                    channelARN = res?.ChannelInfoList[0]?.ChannelARN;
                }
            });
        return channelARN;
    }

    async deleteSignalingChannel(kinesisChannelARN: string) {
        const kinesisVideo = new AWS.KinesisVideo({
            region: process.env[ConfigKey.AWS_REGION],
            accessKeyId: process.env[ConfigKey.AWS_ACCESS_KEY_ID],
            secretAccessKey: process.env[ConfigKey.AWS_SECRET_ACCESS_KEY],
            endpoint: null,
            sessionToken: null,
        });
        let msg = '';
        await kinesisVideo
            .deleteSignalingChannel({
                ChannelARN: kinesisChannelARN,
            })
            .promise()
            .catch(async (error) => {
                msg = error;
            });
        return msg;
    }
}
