import { Model } from 'mongoose';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
    CameraGroup,
    CameraGroupDocument,
} from 'src/modules/camera-group/schema/cameraGroup.schema';
import { CameraGroupDetailDropdownResponseDto } from 'src/modules/camera-group/dto/response/list-cameraGroup.dto';
import { IBaseQueryList } from '../common.types';
import {
    OrderBy,
    DEFAULT_LIMIT_FOR_DROPDOWN,
    UserTypes,
} from 'src/common/constants';
import {
    Camera,
    CameraDocument,
} from 'src/modules/camera/schema/camera.schema';
import { MIN_PAGE_VALUE, OrderDirection } from 'src/common/constants';
import { CommonCameraListQueryDto } from '../dto/request/list-common.dto';
import { getMongoKeywordConditions } from '../helper/helper';
import { buildTreeGroups } from '../helper/tree.helper';
import { ILoginUser } from 'src/common/interfaces/auth.interfaces';
import { getTotalSkipItem } from 'src/common/helpers/commonFunctions';
import { CameraGroupService } from 'src/modules/camera-group/service/cameraGroup.service';

const cameraListAttributes = [
    '_id',
    'cameraGroups',
    'name',
    'serialNumber',
    'createdAt',
    'updatedAt',
    'connectionStatus',
];
@Injectable()
export class CommonDropdownService {
    constructor(
        @Inject('winston') private readonly logger: Logger,
        @InjectModel(CameraGroup.name)
        private cameraGroupModel: Model<CameraGroupDocument>,
        @InjectModel(Camera.name) private cameraModel: Model<CameraDocument>,
        private readonly cameraGroup: CameraGroupService,
    ) {
        //
    }

    async getCameraGroupList(
        query: IBaseQueryList,
    ): Promise<CameraGroupDetailDropdownResponseDto[]> {
        try {
            const cameraGroupList = await buildTreeGroups(
                { keyword: null },
                this.cameraGroupModel,
            );
            return cameraGroupList;
        } catch (error) {
            this.logger.error('Error in getCameraGroupList func: ', error);
            throw error;
        }
    }

    async getCameraList(
        query: CommonCameraListQueryDto,
        loginUser: ILoginUser,
    ) {
        try {
            const treeUserGroupIds = loginUser?.treeUserGroupIds || [];
            const {
                page = MIN_PAGE_VALUE,
                limit = DEFAULT_LIMIT_FOR_DROPDOWN,
                keyword = '',
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
                if (cameraList.length) {
                    cameraList.forEach((camera) => {
                        delete camera['intersectionUserIdsArr'];
                        delete camera['intersectionCameraGroupIdsArr'];
                        delete camera['deletedAt'];
                        camera.cameraGroupIds =
                            ((
                                camera?.cameraGroups as CameraGroupDocument[]
                            )?.map((ele) => ele?._id) as string[]) || null;
                    });
                }
                return cameraList;
            }
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
                    camera.cameraGroupIds =
                        ((camera?.cameraGroups as CameraGroupDocument[])?.map(
                            (ele) => ele?._id,
                        ) as string[]) || null;
                });
            }
            return cameraList;
        } catch (error) {
            this.logger.error('Error in getCameraList func: ', error);
            throw error;
        }
    }
}
