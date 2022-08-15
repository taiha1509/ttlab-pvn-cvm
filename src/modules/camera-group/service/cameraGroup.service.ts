import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { CameraGroup, CameraGroupDocument } from '../schema/cameraGroup.schema';
import { UpdateCameraGroupDto } from '../dto/request/update-cameraGroup.dto';
import { CreateCameraGroupDto } from '../dto/request/create-cameraGroup.dto';
import {
    CameraGroupDetail,
    CameraGroupListResponseDto,
} from '../dto/response/list-cameraGroup.dto';
import { CameraGroupListQueryDto } from '../dto/request/list-groupCamera.dto';
import { buildTreeGroups } from 'src/modules/common/helper/tree.helper';
import { ROOT_GROUP_LEVEL } from '../cameraGroup.constant';
import { MongoCollections } from 'src/common/constants';
import { concat } from 'lodash';

const deletedGroupCameraAttributes = ['_id'];
const groupCameraDetailAttributes = [
    '_id',
    'name',
    'parentId',
    'level',
    'userIds',
];
@Injectable()
export class CameraGroupService {
    constructor(
        @InjectModel(CameraGroup.name)
        private cameraGroupModel: Model<CameraGroupDocument>,
    ) {}

    async createCameraGroup(
        createGroupCameraDto: CreateCameraGroupDto,
    ): Promise<CameraGroup> {
        try {
            const createCamera = new this.cameraGroupModel({
                ...createGroupCameraDto,
                level: createGroupCameraDto.parentId
                    ? createGroupCameraDto.level
                    : ROOT_GROUP_LEVEL,
                // TODO check spec update then add following line, by default, user create camera can manage this camera
                // userIds: [createGroupCameraDto.createdBy],
            });
            return await createCamera.save();
        } catch (error) {
            throw error;
        }
    }

    async updateCameraGroupById(
        id: string,
        updateGroupCameraDto: UpdateCameraGroupDto,
    ): Promise<CameraGroup> {
        try {
            const updateGroupCamera = await this.cameraGroupModel
                .findByIdAndUpdate(new ObjectId(id), updateGroupCameraDto, {
                    returnDocument: 'after',
                })
                .select(groupCameraDetailAttributes);
            return updateGroupCamera;
        } catch (error) {
            throw error;
        }
    }

    async deleteGroupCameraById(
        id: string,
        deleteCameraDto,
    ): Promise<CameraGroup> {
        try {
            const deletedCamera = await this.cameraGroupModel
                .findByIdAndUpdate(new ObjectId(id), {
                    deletedAt: deleteCameraDto.deletedAt,
                    deletedBy: deleteCameraDto.deletedBy,
                })
                .select(deletedGroupCameraAttributes);
            return deletedCamera;
        } catch (error) {
            throw error;
        }
    }

    async getGroupCameraListByParentId(
        id: ObjectId | null,
        attrs = groupCameraDetailAttributes,
    ): Promise<CameraGroupDetail[]> {
        try {
            const groupCameraInfo = await this.cameraGroupModel
                .find(
                    {
                        $and: [
                            {
                                parentId: id ? id : { $eq: null },
                                deletedAt: { $exists: true, $eq: null },
                            },
                        ],
                    },
                    attrs,
                )
                .exec();
            return groupCameraInfo;
        } catch (error) {
            throw error;
        }
    }

    async getGroupCameraList(
        query: CameraGroupListQueryDto,
    ): Promise<CameraGroupListResponseDto> {
        try {
            const groupCameraList = await buildTreeGroups(
                query,
                this.cameraGroupModel,
            );
            return {
                items: groupCameraList,
                totalItems: groupCameraList.length,
            };
        } catch (error) {
            throw error;
        }
    }

    async getGroupCameraById(
        id: ObjectId,
        attrs = groupCameraDetailAttributes,
    ): Promise<CameraGroupDetail> {
        try {
            const groupCameraInfo = await this.cameraGroupModel.findOne(
                {
                    $and: [
                        {
                            _id: new ObjectId(id),
                            deletedAt: { $exists: true, $eq: null },
                        },
                    ],
                },
                [...attrs],
            );
            return groupCameraInfo;
        } catch (error) {
            throw error;
        }
    }

    async checkNameIsExisted(
        name: string,
        parentId: ObjectId,
        id?: ObjectId,
    ): Promise<boolean> {
        try {
            const condition = {
                parentId: parentId ? parentId : { $eq: null },
                deletedAt: { $exists: true, $eq: null },
                name: name.toLowerCase(),
            };
            if (id) condition['_id'] = { $ne: id };
            const subGroup = await this.cameraGroupModel
                .findOne({
                    $and: [condition],
                })
                .collation({ locale: 'en', strength: 2 });
            return !!subGroup;
        } catch (error) {
            throw error;
        }
    }

    /**
     * iterate the tree by given node and get all id of each node and return
     * @param rootNode root node id
     */
    async getAllIdInTrees(rootNodeIds: string[]): Promise<string[]> {
        const graph = await this.cameraGroupModel
            .aggregate()
            .graphLookup({
                from: 'camera_groups',
                startWith: '$_id',
                connectFromField: '_id',
                connectToField: 'parentId',
                as: 'children',
            })
            .match({
                deletedAt: { $exists: true, $eq: null },
                _id: { $in: rootNodeIds },
            })
            .project({
                children: 1,
            })
            .exec();
        const result = [];
        graph.forEach((gr) => {
            result.push(
                ...concat(
                    [gr['_id']],
                    gr['children'].map((item) => item._id),
                ),
            );
        });
        return result;
    }

    async getCameraGroupIdsListByUserIds(userIds: number[]): Promise<string[]> {
        const cameraGroups = await this.cameraGroupModel
            .aggregate([
                {
                    $addFields: {
                        allowedUserIds: userIds,
                    },
                },
                {
                    $project: {
                        intersectionUserIdsArr: {
                            $setIntersection: ['$allowedUserIds', '$userIds'],
                        },
                        allowedUserIds: 1,
                        userIds: 1,
                        deletedAt: 1,
                    },
                },
                {
                    $match: {
                        deletedAt: { $exists: true, $eq: null },
                        intersectionUserIdsArr: {
                            $not: {
                                $size: 0,
                            },
                        },
                    },
                },
            ])
            .exec();
        return cameraGroups.map((item) => item._id);
    }
}
