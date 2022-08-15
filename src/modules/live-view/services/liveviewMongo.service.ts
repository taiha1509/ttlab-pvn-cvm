import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import ConfigKey from 'src/common/config/config-key';
import { CameraGroupService } from 'src/modules/camera-group/service/cameraGroup.service';
import {
    Camera,
    CameraDocument,
} from 'src/modules/camera/schema/camera.schema';
import { LiveViewQueryDto } from '../dto/request/list-live-view';
import { ListLiveViewResponseDto } from '../dto/response/list-live-view';
import { liveViewInfoAttributes } from '../liveView.constants';
import { ILoginUser } from 'src/common/interfaces/auth.interfaces';

@Injectable()
export class LiveViewCameraService {
    constructor(
        @InjectModel(Camera.name) private cameraModel: Model<CameraDocument>,
        private readonly cameraGroup: CameraGroupService,
    ) {}

    async getLiveViewInfoDeviceAdmin(
        query: LiveViewQueryDto,
    ): Promise<ListLiveViewResponseDto> {
        const { cameraGroupIds } = query;
        const condition = {
            cameraGroups: cameraGroupIds,
            deletedAt: { $exists: true, $eq: null },
        };
        const cameraInfoList = await this.cameraModel
            .find({
                $and: [condition],
            })
            .select(liveViewInfoAttributes)
            .exec();

        const count = await this.cameraModel.count({
            $and: [condition],
        });
        const cameraInfo = cameraInfoList.map((item) => ({
            _id: item._id,
            name: item.name,
            uid: item.uid,
            model: item.model,
            serialNumber: item.serialNumber,
            channelName: item.kinesisChannelARN,
        }));
        return {
            items: cameraInfo,
            region: process.env[ConfigKey.AWS_REGION],
            accessKey: process.env[ConfigKey.AWS_SECRET_ACCESS_KEY],
            accessKeyId: process.env[ConfigKey.AWS_ACCESS_KEY_ID],
            totalItems: count,
        };
    }

    async getLivewViewInfoUser(
        query: LiveViewQueryDto,
        loginUser: ILoginUser,
    ): Promise<ListLiveViewResponseDto> {
        const { cameraGroupIds } = query;
        const treeUserGroupIds = loginUser?.treeUserGroupIds || [];
        const condition = {
            cameraGroups: new ObjectId(cameraGroupIds),
            deletedAt: { $exists: true, $eq: null },
        };
        const projectOps = {};
        liveViewInfoAttributes.forEach((attr) => {
            projectOps[attr] = 1;
        });
        // list camera groupIds assign by list user ids, include their children
        const cameraGroupIdLists =
            await this.cameraGroup.getCameraGroupIdsListByUserIds([
                loginUser?.id as number,
            ]);
        const allCameraGroupIds = await this.cameraGroup.getAllIdInTrees(
            cameraGroupIdLists,
        );
        const additionalCondition = {
            $and: [
                {
                    $or: [
                        {
                            intersectionUserIdsArr: {
                                $not: {
                                    $size: 0,
                                },
                            },
                        },
                        {
                            intersectionCameraGroupIdsArr: {
                                $not: {
                                    $size: 0,
                                },
                            },
                        },
                        {
                            intersectionUserGroupIdsArr: {
                                $not: {
                                    $size: 0,
                                },
                            },
                        },
                    ],
                },
            ],
        };
        const cameraList = await this.cameraModel
            .aggregate([
                {
                    $match: condition,
                },
            ])
            .addFields({
                allowedUserIds: [loginUser?.id as number],
                allowedCameraGroupIds: allCameraGroupIds,
                allowUserGroupIds: treeUserGroupIds,
            })
            .collation({ locale: 'en' })
            .project({
                ...projectOps,
                userIds: 1,
                allowedUserIds: 1,
                intersectionUserIdsArr: {
                    $setIntersection: ['$allowedUserIds', '$userIds'],
                },
                intersectionUserGroupIdsArr: {
                    $setIntersection: ['$allowUserGroupIds', '$userGroupIds'],
                },
                intersectionCameraGroupIdsArr: {
                    $setIntersection: [
                        '$allowedCameraGroupIds',
                        '$cameraGroups',
                    ],
                },
                deletedAt: 1,
            })
            .match({ ...additionalCondition })
            .exec();

        const totalCameras = await this.cameraModel
            .aggregate([
                {
                    $match: condition,
                },
            ])
            .addFields({
                allowedUserIds: [loginUser?.id as number],
                allowedCameraGroupIds: allCameraGroupIds,
                allowUserGroupIds: treeUserGroupIds,
            })
            .collation({ locale: 'en' })
            .project({
                intersectionUserIdsArr: {
                    $setIntersection: ['$allowedUserIds', '$userIds'],
                },
                intersectionCameraGroupIdsArr: {
                    $setIntersection: [
                        '$allowedCameraGroupIds',
                        '$cameraGroups',
                    ],
                },
                intersectionUserGroupIdsArr: {
                    $setIntersection: ['$allowUserGroupIds', '$userGroupIds'],
                },
                deletedAt: 1,
            })
            .match({ ...additionalCondition })
            .count('total')
            .exec();
        if (cameraList.length) {
            cameraList.forEach((camera) => {
                delete camera['intersectionUserIdsArr'];
                delete camera['intersectionCameraGroupIdsArr'];
                delete camera['deletedAt'];
            });
        }
        const cameraInfo = cameraList.map((item) => ({
            _id: item._id,
            name: item.name,
            uid: item.uid,
            model: item.model,
            serialNumber: item.serialNumber,
            channelName: item.kinesisChannelARN,
        }));
        return {
            items: cameraInfo,
            totalItems: (totalCameras[0]?.total as number) || 0,
            region: process.env[ConfigKey.AWS_REGION],
            accessKey: process.env[ConfigKey.AWS_SECRET_ACCESS_KEY],
            accessKeyId: process.env[ConfigKey.AWS_ACCESS_KEY_ID],
        };
    }
}
