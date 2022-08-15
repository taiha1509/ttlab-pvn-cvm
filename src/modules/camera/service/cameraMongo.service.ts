import { Model, QueryOptions } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Camera, CameraDocument } from '../schema/camera.schema';
import { CreateCameraDto } from '../dto/request/create-camera.dto';
import { CameraListQueryDto } from '../dto/request/list-camera.dto';
import {
    CameraDetailResponseDto,
    CameraListResponseDto,
} from '../dto/response/detail.dto';
import { getTotalSkipItem } from 'src/common/helpers/commonFunctions';
import { ObjectId } from 'mongodb';
import {
    UpdateCameraDto,
    UpdateCameraRecordingConfigurationDto,
} from '../dto/request/update-camera.dto';
import {
    DEFAULT_LIMIT_FOR_PAGINATION,
    MIN_PAGE_VALUE,
    OrderBy,
    OrderDirection,
    UserTypes,
} from 'src/common/constants';
import { getMongoKeywordConditions } from 'src/modules/common/helper/helper';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { ConfigService } from '@nestjs/config';
import { MODULE_NAME } from '../camera.constant';
import { CameraConfiguration } from 'src/modules/common/common.constant';
import { ConnectionStatus } from 'src/modules/device-controller/deviceController.constant';
import { CameraGroupService } from 'src/modules/camera-group/service/cameraGroup.service';
import { ILoginUser } from 'src/common/interfaces/auth.interfaces';
const deletedCameraAttributes = ['_id'];
export const cameraDetailAttributes = [
    '_id',
    'name',
    'model',
    'serialNumber',
    'uid',
    'cameraGroups',
    'userGroupIds',
    'userIds',
    'kinesisChannelARN',
    'recordingConfiguration',
    'connectionStatus',
    'password',
    'userName',
    'onvifProfile',
];
const cameraListAttributes = [
    '_id',
    'name',
    'model',
    'serialNumber',
    'uid',
    'connectionStatus',
];

@Injectable()
export class CameraMongoService {
    constructor(
        @InjectModel(Camera.name) private cameraModel: Model<CameraDocument>,
        private readonly configService: ConfigService,
        private readonly cameraGroup: CameraGroupService,
    ) {
        //
    }

    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );

    async createCamera(createCameraDto: CreateCameraDto): Promise<Camera> {
        try {
            const createCamera = new this.cameraModel({
                ...createCameraDto,
                // by default, user create a group can manage that group
                userIds: [createCameraDto.createdBy],
            });
            return await createCamera.save();
        } catch (error) {
            throw error;
        }
    }

    async updateCameraById(
        id: string,
        updateCameraDto: UpdateCameraDto,
        options?: QueryOptions,
    ): Promise<Camera> {
        try {
            const updateCamera = await this.cameraModel
                .findByIdAndUpdate(new ObjectId(id), updateCameraDto, options)
                .select(cameraDetailAttributes);
            return updateCamera;
        } catch (error) {
            throw error;
        }
    }

    async deleteCameraById(id: string, deleteCameraDto): Promise<Camera> {
        try {
            const deletedCamera = await this.cameraModel
                .findByIdAndUpdate(new ObjectId(id), {
                    deletedAt: deleteCameraDto.deletedAt,
                    deletedBy: deleteCameraDto.deletedBy,
                })
                .select(deletedCameraAttributes);
            return deletedCamera;
        } catch (error) {
            throw error;
        }
    }

    async getCameraById(
        id: string,
        attrs = cameraDetailAttributes,
        options?: QueryOptions,
    ): Promise<CameraDetailResponseDto> {
        try {
            const camera = await this.cameraModel
                .findOne(
                    {
                        $and: [
                            {
                                _id: new ObjectId(id),
                                deletedAt: { $exists: true, $eq: null },
                            },
                        ],
                    },
                    attrs,
                    options,
                )
                .lean(true)
                .populate('cameraGroups', ['_id', 'name']);
            if (camera)
                camera.configurations =
                    CameraConfiguration[camera?.model] || [];
            return camera;
        } catch (error) {
            throw error;
        }
    }

    async getCameraForScheduleUpdateByIds() {
        try {
            const cameraList = await this.cameraModel
                .find({
                    deletedAt: { $exists: true, $eq: null },
                })
                .select(['_id', 'uid', 'recordingConfiguration'])
                .exec();
            return cameraList;
        } catch (error) {
            throw error;
        }
    }

    async getCameraForScheduleUpdateById(cameraId: ObjectId) {
        try {
            const camera = await this.cameraModel
                .findOne({
                    _id: cameraId,
                    deletedAt: { $exists: true, $eq: null },
                })
                .select(['_id', 'uid', 'recordingConfiguration'])
                .exec();
            return camera;
        } catch (error) {
            throw error;
        }
    }

    async getCameraList(
        query: CameraListQueryDto,
        loginUser: ILoginUser,
    ): Promise<CameraListResponseDto> {
        try {
            const treeUserGroupIds = loginUser.treeUserGroupIds;
            const {
                page = MIN_PAGE_VALUE,
                limit = DEFAULT_LIMIT_FOR_PAGINATION,
                keyword = '',
                uid = '',
                cameraGroupId = '',
                orderDirection = OrderDirection.DESC,
                orderBy = OrderBy.CREATED_AT,
            } = query;
            const condition = {
                $and: [
                    {
                        $or: getMongoKeywordConditions(
                            ['name', 'serialNumber'],
                            keyword,
                        ),
                    },
                    { deletedAt: { $exists: true, $eq: null } },
                ],
            };
            if (query?.cameraGroupId)
                Object.assign(condition, {
                    cameraGroups: new ObjectId(cameraGroupId),
                });
            if (query?.uid)
                Object.assign(condition, {
                    uid: uid,
                });
            // setup project operators
            const projectOps = {};
            cameraListAttributes.forEach((attr) => {
                projectOps[attr] = 1;
            });
            // this login user is not a device admin

            if (
                !(loginUser?.types as UserTypes[])?.includes(
                    UserTypes.DEVICE_ADMIN,
                )
            ) {
                // list camera groupIds assign by list user ids, include their children
                const cameraGroupIds =
                    await this.cameraGroup.getCameraGroupIdsListByUserIds([
                        loginUser?.id as number,
                    ]);
                const allCameraGroupIds =
                    await this.cameraGroup.getAllIdInTrees(cameraGroupIds);
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
                const condition = {
                    $or: getMongoKeywordConditions(
                        ['name', 'serialNumber'],
                        keyword,
                    ),
                    deletedAt: { $exists: true, $eq: null },
                };
                if (query?.cameraGroupId)
                    Object.assign(condition, {
                        cameraGroups: new ObjectId(cameraGroupId),
                    });
                const cameraList = await this.cameraModel
                    .aggregate([
                        {
                            $match: condition,
                        },
                        {
                            $sort: {
                                [orderBy]:
                                    orderDirection === OrderDirection.DESC
                                        ? -1
                                        : 1,
                            },
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
                            $setIntersection: [
                                '$allowUserGroupIds',
                                '$userGroupIds',
                            ],
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
                    .skip(getTotalSkipItem(page, limit))
                    .limit(+limit)
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
                            $setIntersection: [
                                '$allowUserGroupIds',
                                '$userGroupIds',
                            ],
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
                        camera.configurations =
                            CameraConfiguration[camera.model] || [];
                    });
                }
                return {
                    items: cameraList,
                    totalItems: (totalCameras[0]?.total as number) || 0,
                };
            }

            const cameraLength = await this.cameraModel.count({
                $and: [condition],
            });
            const cameraList = await this.cameraModel
                .find({
                    $and: [condition],
                })
                .collation({ locale: 'en' })
                .sort({ [orderBy]: orderDirection })
                .skip(getTotalSkipItem(page, limit))
                .limit(+limit)
                .select(cameraListAttributes)
                .exec();
            if (cameraList.length) {
                cameraList.forEach((camera) => {
                    camera.configurations =
                        CameraConfiguration[camera.model] || [];
                });
            }
            return {
                items: cameraList,
                totalItems: cameraLength,
            };
        } catch (error) {
            throw error;
        }
    }

    async getNumberOfCameraInOneGroup(
        cameraGroupId: string,
        cameraId?: ObjectId,
    ) {
        try {
            const condition = {
                deletedAt: { $exists: true, $eq: null },
            };
            Object.assign(condition, {
                cameraGroups: {
                    $elemMatch: { $eq: new ObjectId(cameraGroupId) },
                },
            });
            if (cameraId) {
                Object.assign(condition, {
                    _id: { $ne: cameraId },
                });
            }
            const cameraLength = await this.cameraModel.count({
                $and: [condition],
            });
            return cameraLength;
        } catch (error) {
            throw error;
        }
    }

    async checkCameraExisted(fieldName: string, fieldValue: string) {
        try {
            const checkCameraExisted = await this.cameraModel
                .findOne({
                    [fieldName]: fieldValue,
                    deletedAt: { $exists: true, $eq: null },
                })
                .exec();
            return !!checkCameraExisted;
        } catch (error) {
            throw error;
        }
    }

    async updateCameraRecordingConfiguration(
        cameraId: string,
        data: UpdateCameraRecordingConfigurationDto,
    ) {
        try {
            await this.cameraModel.updateOne(
                { _id: cameraId, deletedAt: null },
                { recordingConfiguration: data },
            );
            const cameraDetail = await this.getCameraById(cameraId);
            return cameraDetail;
        } catch (error) {
            throw error;
        }
    }

    async updateConnectionStatus(
        camera: CameraDetailResponseDto,
    ): Promise<CameraDetailResponseDto> {
        try {
            await this.cameraModel.updateOne(
                { uid: camera.uid, deletedAt: null },
                {
                    connectionStatus: ConnectionStatus.ONLINE,
                    lastUpdateConnectionStatusAt: new Date(),
                },
            );

            return await this.getCameraById(camera._id);
        } catch (error) {
            throw error;
        }
    }

    async getCameraByUid(
        uid: string,
        attrs = cameraDetailAttributes,
        options?: QueryOptions,
    ): Promise<CameraDetailResponseDto> {
        try {
            const camera = await this.cameraModel
                .findOne(
                    {
                        $and: [
                            {
                                uid,
                                deletedAt: { $exists: true, $eq: null },
                            },
                        ],
                    },
                    attrs,
                    options,
                )
                .lean(true)
                .populate('cameraGroups', ['_id', 'name']);
            camera.configurations = CameraConfiguration[camera?.model] || [];
            return camera;
        } catch (error) {
            throw error;
        }
    }

    // check if login user has access to camera, to take some actions like update, get, even delete.
    async checkLoginUserCanAccessCamera(
        cameraId: string,
        loginUser: ILoginUser,
    ): Promise<boolean> {
        try {
            const treeUserGroupIds = loginUser?.treeUserGroupIds;
            // list camera groupIds assign by user id, include their children
            const cameraGroupIds =
                await this.cameraGroup.getCameraGroupIdsListByUserIds([
                    loginUser?.id as number,
                ]);
            // this is list camera group ids, each entity is a child of 1 camera group in above
            const allCameraGroupIds = await this.cameraGroup.getAllIdInTrees(
                cameraGroupIds,
            );
            const cameraQuerybuilder = this.cameraModel
                .aggregate([
                    {
                        $match: {
                            deletedAt: { $exists: true, $eq: null },
                        },
                    },
                ])
                .addFields({
                    allowedUserIds: [loginUser?.id as number],
                    allowedCameraGroupIds: allCameraGroupIds,
                    allowUserGroupIds: treeUserGroupIds,
                })
                .collation({ locale: 'en' });

            const condition = {
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
                        _id: {
                            $eq: new ObjectId(cameraId),
                        },
                    },
                ],
            };
            const count = await cameraQuerybuilder
                .project({
                    userIds: 1,
                    allowedUserIds: 1,
                    intersectionUserIdsArr: {
                        $setIntersection: ['$allowedUserIds', '$userIds'],
                    },
                    intersectionUserGroupIdsArr: {
                        $setIntersection: [
                            '$allowUserGroupIds',
                            '$userGroupIds',
                        ],
                    },
                    intersectionCameraGroupIdsArr: {
                        $setIntersection: [
                            '$allowedCameraGroupIds',
                            '$cameraGroups',
                        ],
                    },
                    deletedAt: 1,
                })
                .match({ ...condition })
                .count('total')
                .exec();
            return ((count[0]?.total as number) || 0) > 0;
        } catch (error) {
            throw error;
        }
    }

    async updateDeletedCameraGroup(cameraGroupId: string) {
        try {
            const cameraList = await this.cameraModel
                .find({
                    $and: [
                        {
                            cameraGroups: cameraGroupId,
                            deletedAt: { $exists: true, $eq: null },
                        },
                    ],
                })
                .select(cameraDetailAttributes)
                .exec();
            cameraList.forEach(async (camera) => {
                const index = camera.cameraGroups.findIndex(
                    (cameraGroup) => cameraGroup.toString() === cameraGroupId,
                );
                if (index > -1) camera.cameraGroups.splice(index);
                await this.cameraModel.findByIdAndUpdate(camera._id, camera);
            });
        } catch (error) {
            throw error;
        }
    }
}
